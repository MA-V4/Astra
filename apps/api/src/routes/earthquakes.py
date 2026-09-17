import time
from typing import Any

import httpx
from fastapi import APIRouter

router = APIRouter()

_quake_cache:      list[dict[str, Any]] = []
_quake_fetched_at: float = 0
QUAKE_TTL = 60

USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"


@router.get("/earthquakes")
async def get_earthquakes():
    global _quake_cache, _quake_fetched_at

    if time.time() - _quake_fetched_at < QUAKE_TTL and _quake_cache:
        return _quake_cache

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(USGS_URL, timeout=10)
            r.raise_for_status()
            features = r.json().get("features", [])
            _quake_cache = [
                {
                    "id":       f["id"],
                    "mag":      f["properties"]["mag"],
                    "place":    f["properties"]["place"],
                    "time":     f["properties"]["time"],
                    "tsunami":  f["properties"]["tsunami"],
                    "lat":      f["geometry"]["coordinates"][1],
                    "lon":      f["geometry"]["coordinates"][0],
                    "depth_km": f["geometry"]["coordinates"][2],
                }
                for f in features
                if f["properties"]["mag"] is not None
            ]
            _quake_fetched_at = time.time()
    except Exception as e:
        print(f"earthquake fetch failed: {e}")

    return _quake_cache
