# HISTORY ROUTE
# GET /history?ts=<unix_timestamp> - returns all archived layers at that time.
# GET /history/range              - returns the available time window.

import time

from fastapi import APIRouter, Query
from ..services.history import read_nearest, available_range

router = APIRouter()


@router.get("/history/range")
async def get_range():
    return available_range()


@router.get("/history")
async def get_history(
    ts: float = Query(None, description="Unix timestamp to seek to"),
):
    target = ts or time.time()

    return {
        "ts":          target,
        "flights":     read_nearest("flights",     target),
        "earthquakes": read_nearest("earthquakes", target),
        "fires":       read_nearest("fires",       target),
    }