import time
from typing import Any

import httpx
from fastapi import APIRouter

router = APIRouter()

_flight_cache:      list[dict[str, Any]] = []
_flight_fetched_at: float = 0
FLIGHT_TTL = 15  # seconds

OPENSKY_URL = "https://opensky-network.org/api/states/all"


@router.get("/flights")
async def get_flights():
    global _flight_cache, _flight_fetched_at

    if time.time() - _flight_fetched_at < FLIGHT_TTL and _flight_cache:
        return _flight_cache

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(OPENSKY_URL, timeout=10)
            r.raise_for_status()
            data  = r.json()
            states = data.get("states", []) or []

            _flight_cache = [
                {
                    "icao24":          s[0],
                    "callsign":        (s[1] or "").strip(),
                    "origin_country":  s[2] or "",
                    "time_position":   s[3],
                    "last_contact":    s[4],
                    "longitude":       s[5],
                    "latitude":        s[6],
                    "baro_altitude":   s[7],
                    "on_ground":       s[8],
                    "velocity":        s[9],
                    "true_track":      s[10],
                    "vertical_rate":   s[11],
                    "geo_altitude":    s[13],
                    "squawk":          s[14],
                    "spi":             s[15],
                    "position_source": s[16],
                }
                for s in states
                if s[5] is not None and s[6] is not None
            ]
            _flight_fetched_at = time.time()
    except Exception as e:
        print(f"flight fetch failed: {e}")

    return _flight_cache
