# BRIEFING ROUTE

from fastapi import APIRouter, Query
from ..services.briefing import generate_briefing, filter_region, RegionContext
from . import earthquakes as eq_route
from . import flights     as fl_route
from . import fires       as fi_route
from . import launches    as la_route

router = APIRouter()


@router.get("/briefing")
async def get_briefing(
    lat:    float = Query(..., ge=-90,  le=90),
    lon:    float = Query(..., ge=-180, le=180),
    radius: float = Query(500, ge=50,   le=2000),
):
    ctx = RegionContext(
        lat         = lat,
        lon         = lon,
        radius_km   = radius,
        earthquakes = filter_region(eq_route._quake_cache,  lat, lon, radius),
        flights     = filter_region(fl_route._flight_cache, lat, lon, radius),
        vessels     = [],
        fires       = filter_region(fi_route._fire_cache,   lat, lon, radius),
        anomalies   = [],
        launches    = filter_region(la_route._launch_cache, lat, lon, radius),
    )

    return await generate_briefing(ctx)