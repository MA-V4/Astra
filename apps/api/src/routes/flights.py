import time
from typing import Any

import httpx
from fastapi import APIRouter

router = APIRouter()

_flight_cache:      list[dict[str, Any]] = []
_flight_fetched_at: float = 0
FLIGHT_TTL = 15

# adsb.fi - community feed, no auth, no rate limits
ADSB_URL = "https://opendata.adsb.fi/api/v2/flights"


@router.get("/flights")
async def get_flights():
    global _flight_cache, _flight_fetched_at

    if time.time() - _flight_fetched_at < FLIGHT_TTL and _flight_cache:
        return _flight_cache

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(ADSB_URL, timeout=10,
                headers={"User-Agent": "ASTRA/0.1 orbital intelligence platform"})
            r.raise_for_status()
            data   = r.json()
            states = data.get("aircraft", []) or []

            _flight_cache = [
                {
                    "icao24":         s.get("hex", ""),
                    "callsign":       (s.get("flight", "") or "").strip(),
                    "origin_country": s.get("r", ""),
                    "time_position":  s.get("seen_pos", 0),
                    "last_contact":   s.get("seen", 0),
                    "longitude":      s.get("lon"),
                    "latitude":       s.get("lat"),
                    "baro_altitude":  (s.get("alt_baro") or 0) * 0.3048 if isinstance(s.get("alt_baro"), (int, float)) else 0,
                    "on_ground":      s.get("alt_baro") == "ground",
                    "velocity":       (s.get("gs") or 0) * 0.514444,
                    "true_track":     s.get("track") or 0,
                    "vertical_rate":  s.get("baro_rate") or 0,
                    "geo_altitude":   (s.get("alt_geom") or 0) * 0.3048,
                    "squawk":         s.get("squawk", ""),
                    "spi":            False,
                    "position_source": 0,
                }
                for s in states
                if s.get("lon") is not None and s.get("lat") is not None
            ]
            _flight_fetched_at = time.time()
            print(f"Flights updated: {len(_flight_cache)} aircraft from adsb.fi")
    except Exception as e:
        print(f"flight fetch failed: {e}")

    return _flight_cache