import time
from typing import Any

import httpx
from fastapi import APIRouter

router = APIRouter()

_launch_cache:      list[dict[str, Any]] = []
_launch_fetched_at: float = 0
LAUNCH_TTL = 300

LL2_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=20&ordering=net"


@router.get("/launches")
async def get_launches():
    global _launch_cache, _launch_fetched_at

    if time.time() - _launch_fetched_at < LAUNCH_TTL and _launch_cache:
        return _launch_cache

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(LL2_URL, timeout=15,
                headers={"User-Agent": "ASTRA/0.1 (orbital intelligence platform)"})
            r.raise_for_status()
            results = r.json().get("results", [])

            _launch_cache = []
            for l in results:
                pad = l.get("pad", {})
                loc = pad.get("location", {})
                _launch_cache.append({
                    "id":          l.get("id", ""),
                    "name":        l.get("name", ""),
                    "provider":    l.get("launch_service_provider", {}).get("name", ""),
                    "vehicle":     l.get("rocket", {}).get("configuration", {}).get("name", ""),
                    "pad":         pad.get("name", ""),
                    "lat":         float(pad.get("latitude")  or 0),
                    "lon":         float(pad.get("longitude") or 0),
                    "net":         l.get("net", ""),
                    "status":      l.get("status", {}).get("name", ""),
                    "description": l.get("mission", {}).get("description", "") if l.get("mission") else "",
                })
            _launch_fetched_at = time.time()
    except Exception as e:
        print(f"launch fetch failed: {e}")

    return _launch_cache
