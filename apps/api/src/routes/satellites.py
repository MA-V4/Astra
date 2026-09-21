# SATELLITES
# Fetches TLE data from CelesTrak GP endpoint and caches for 2 hours.

import asyncio
import time
from typing import Any

import httpx
from fastapi import APIRouter

router = APIRouter()

_tle_cache:      list[dict[str, Any]] = []
_tle_fetched_at: float = 0
TLE_TTL = 60 * 60 * 2

# CelesTrak GP groups - correct endpoint
CELESTRAK_BASE = "https://celestrak.org/GP/groups/{group}/format/json"

TLE_GROUPS = ["stations", "starlink", "active", "debris"]


async def fetch_tle_group(client: httpx.AsyncClient, group: str) -> list[dict]:
    url = f"https://celestrak.org/GP/groups/{group}/format/json"
    try:
        r = await client.get(url, timeout=20, headers={"User-Agent": "ASTRA/0.1"})
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
        print(f"TLE fetch failed for {group}: {type(e).__name__}: {e}")
        return []


async def refresh_tles():
    global _tle_cache, _tle_fetched_at
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            *[fetch_tle_group(client, g) for g in TLE_GROUPS]
        )
    seen   = set()
    merged = []
    for batch in results:
        for sat in batch:
            if sat["norad_id"] not in seen and sat["norad_id"] != 0:
                seen.add(sat["norad_id"])
                merged.append(sat)
    _tle_cache      = merged
    _tle_fetched_at = time.time()
    print(f"TLE cache refreshed: {len(_tle_cache)} satellites")


@router.get("/satellites")
async def get_satellites():
    if time.time() - _tle_fetched_at > TLE_TTL or not _tle_cache:
        asyncio.create_task(refresh_tles())
    return _tle_cache


@router.on_event("startup")
async def startup():
    asyncio.create_task(refresh_tles())