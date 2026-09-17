# ANOMALY ROUTE
# Pulls cached data from all active routes and runs the detection engine.

from fastapi import APIRouter
from ..services import anomaly_detector
from . import earthquakes as eq_route
from . import flights     as fl_route
from . import fires       as fi_route

router = APIRouter()


@router.get("/anomalies")
async def get_anomalies():
    return anomaly_detector.run_all(
        earthquakes = eq_route._quake_cache,
        flights     = fl_route._flight_cache,
        vessels     = [],
        fires       = fi_route._fire_cache,
    )