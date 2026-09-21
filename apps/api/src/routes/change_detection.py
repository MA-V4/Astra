# CHANGE DETECTION ROUTE

from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from ..services.sentinel import analyse_region

router = APIRouter()


def validate_date(d: str, label: str) -> str:
    try:
        datetime.strptime(d, "%Y-%m-%d")
        return d
    except ValueError:
        raise HTTPException(400, f"{label} must be YYYY-MM-DD")


@router.get("/change-detection")
async def change_detection(
    lat:    float = Query(..., ge=-90,  le=90),
    lon:    float = Query(..., ge=-180, le=180),
    radius: float = Query(50,  ge=10,   le=500, description="Radius in km"),
    before: str   = Query(None, description="YYYY-MM-DD"),
    after:  str   = Query(None, description="YYYY-MM-DD"),
):
    import datetime as dt
    now = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    after  = after  or now.strftime("%Y-%m-%d")
    before = before or (now - timedelta(days=30)).strftime("%Y-%m-%d")

    validate_date(before, "before")
    validate_date(after,  "after")

    if before >= after:
        raise HTTPException(400, "before must be earlier than after")

    result = await analyse_region(lat, lon, radius, before, after)
    return result