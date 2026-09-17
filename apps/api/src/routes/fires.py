import time
from typing import Any

import httpx
from fastapi import APIRouter
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    nasa_firms_key: str = ""
    class Config:
        env_file = ".env"

settings = Settings()
router   = APIRouter()

_fire_cache:      list[dict[str, Any]] = []
_fire_fetched_at: float = 0
FIRE_TTL = 600


@router.get("/fires")
async def get_fires():
    global _fire_cache, _fire_fetched_at

    if time.time() - _fire_fetched_at < FIRE_TTL and _fire_cache:
        return _fire_cache

    if not settings.nasa_firms_key:
        return _fire_cache  # return empty without key

    try:
        url = (
            f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
            f"{settings.nasa_firms_key}/VIIRS_SNPP_NRT/world/1"
        )
        async with httpx.AsyncClient() as client:
            r = await client.get(url, timeout=15)
            r.raise_for_status()
            lines = r.text.strip().split("\n")
            headers = lines[0].split(",")

            _fire_cache = []
            for line in lines[1:]:
                cols = line.split(",")
                if len(cols) < len(headers):
                    continue
                row = dict(zip(headers, cols))
                try:
                    _fire_cache.append({
                        "lat":        float(row.get("latitude",   0)),
                        "lon":        float(row.get("longitude",  0)),
                        "brightness": float(row.get("bright_ti4", 0)),
                        "frp":        float(row.get("frp",        0)),
                        "acq_date":   row.get("acq_date",  ""),
                        "satellite":  row.get("satellite", ""),
                    })
                except ValueError:
                    continue
            _fire_fetched_at = time.time()
    except Exception as e:
        print(f"fire fetch failed: {e}")

    return _fire_cache
