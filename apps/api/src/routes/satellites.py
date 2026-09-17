import asyncio
import time
from typing import Any

import httpx
from fastapi import APIRouter

router = APIRouter()

# In-memory TLE cache — refreshed every 2 hours
_tle_cache:      list[dict[str, Any]] = []
_tle_fetched_at: float = 0
TLE_TTL = 60 * 60 * 2  # 2 hours

CELESTRAK_URLS = [
    "https://celestrak.org/SOCRATES/query.php?CATNR=25544&DAYS=5&MAX=10&ORDERBY=TIME&FORMAT=tle",
    "https://celestrak.org/SOCRATES/query.php?CATNR=20580&DAYS=5&MAX=10&ORDERBY=TIME&FORMAT=tle",
]

# Active satellite groups from CelesTrak
TLE_GROUPS = [
    ("stations",  "https://celestrak.org/SOCRATES/query.php?GROUP=stations&FORMAT=tle"),
    ("starlink",  "https://celestrak.org/SOCRATES/query.php?GROUP=starlink&FORMAT=tle"),
    ("active",    "https://celestrak.org/SOCRATES/query.php?GROUP=active&FORMAT=tle"),
    ("debris",    "https://celestrak.org/SOCRATES/query.php?GROUP=cosmos-1408-debris&FORMAT=tle"),
]

CELESTRAK_ACTIVE = "https://celestrak.org/SOCRATES/query.php?GROUP=active&FORMAT=tle"

# Simpler: use the JSON API
CELESTRAK_JSON = "https://celestrak.org/SOCRATES/query.php?GROUP=active&FORMAT=json"

async def fetch_tle_group(client: httpx.AsyncClient, group: str) -> list[dict]:
    url = f"https://celestrak.org/SOCRATES/query.php?GROUP={group}&FORMAT=json"
    try:
        r = await client.get(url, timeout=15)
        r.raise_for_status()
        data = r.json()
        return [
            {
                "name":     obj.get("OBJECT_NAME", ""),
                "norad_id": int(obj.get("NORAD_CAT_ID", 0)),
                "line1":    obj.get("TLE_LINE1", ""),
                "line2":    obj.get("TLE_LINE2", ""),
            }
            for obj in data
            if obj.get("TLE_LINE1") and obj.get("TLE_LINE2")
        ]
    except Exception as e:
        print(f"TLE fetch failed for {group}: {e}")
        return []


async def refresh_tles():
    global _tle_cache, _tle_fetched_at
    async with httpx.AsyncClient() as client:
        groups = ["stations", "starlink", "active"]
        results = await asyncio.gather(*[fetch_tle_group(client, g) for g in groups])
        seen   = set()
        merged = []
        for batch in results:
            for sat in batch:
                if sat["norad_id"] not in seen:
                    seen.add(sat["norad_id"])
                    merged.append(sat)
        _tle_cache      = merged
        _tle_fetched_at = time.time()
        print(f"TLE cache refreshed: {len(_tle_cache)} satellites")


@router.get("/satellites")
async def get_satellites():
    if time.time() - _tle_fetched_at > TLE_TTL or not _tle_cache:
        await refresh_tle_cache_background()
    return _tle_cache


async def refresh_tle_cache_background():
    """Non-blocking refresh — returns stale data while refreshing."""
    asyncio.create_task(refresh_tles())
