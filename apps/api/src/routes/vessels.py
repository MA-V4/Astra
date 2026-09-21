# VESSELS
# Maintains a live AISStream WebSocket connection in the background.
# The /vessels endpoint returns the cached snapshot - no per-request socket open.

import asyncio
import json
import os
import time
from typing import Any

from fastapi import APIRouter

router = APIRouter()

# Cache - keyed by MMSI so newer positions overwrite old ones
_vessel_cache: dict[int, dict[str, Any]] = {}
_last_update:  float = 0
_task_running: bool  = False

MAX_VESSELS     = 2000
RECONNECT_DELAY = 10   # seconds before reconnecting after a drop


def _nav_status(code: int) -> str:
    statuses = {
        0:  "underway",
        1:  "at anchor",
        2:  "not under command",
        3:  "restricted manoeuvrability",
        5:  "moored",
        6:  "aground",
        8:  "sailing",
        15: "unknown",
    }
    return statuses.get(code, "unknown")


async def _stream_vessels():
    """Background task: maintain AISStream WebSocket and update cache."""
    global _last_update, _task_running

    api_key = os.environ.get("AISSTREAM_API_KEY", "")
    if not api_key:
        print("AISSTREAM_API_KEY not set - vessel layer disabled")
        return

    _task_running = True

    while True:
        try:
            import websockets
            print("AISStream: connecting...")

            async with websockets.connect(
                "wss://stream.aisstream.io/v0/stream",
                ping_interval=30,
                ping_timeout=10,
            ) as ws:
                await ws.send(json.dumps({
                    "APIKey":             api_key,
                    "BoundingBoxes":      [[[-90, -180], [90, 180]]],
                    "FilterMessageTypes": ["PositionReport"],
                }))

                print("AISStream: connected, streaming positions")

                async for raw in ws:
                    try:
                        msg  = json.loads(raw)
                        meta = msg.get("MetaData", {})
                        pos  = msg.get("Message", {}).get("PositionReport", {})

                        if not pos or not meta:
                            continue

                        mmsi = int(meta.get("MMSI", 0))
                        lat  = float(meta.get("latitude",  0))
                        lon  = float(meta.get("longitude", 0))

                        if mmsi == 0 or (lat == 0 and lon == 0):
                            continue

                        sog     = float(pos.get("Sog", 0))
                        heading = int(pos.get("TrueHeading", 511))
                        nav     = int(pos.get("NavigationalStatus", 15))

                        # Cap cache size - drop oldest entry when full
                        if len(_vessel_cache) >= MAX_VESSELS:
                            oldest = min(_vessel_cache, key=lambda k: _vessel_cache[k].get("last_seen", 0))
                            del _vessel_cache[oldest]

                        _vessel_cache[mmsi] = {
                            "mmsi":      mmsi,
                            "name":      meta.get("ShipName", "").strip() or f"MMSI {mmsi}",
                            "callsign":  "",
                            "type":      "",
                            "lat":       lat,
                            "lon":       lon,
                            "heading":   heading if heading != 511 else 0,
                            "speed_kts": sog,
                            "status":    _nav_status(nav),
                            "dark":      False,
                            "last_seen": time.time(),
                        }
                        _last_update = time.time()

                    except Exception:
                        continue

        except ImportError:
            print("AISStream: 'websockets' not installed - run: pip install websockets --break-system-packages")
            break
        except Exception as e:
            print(f"AISStream: connection lost ({e}) - reconnecting in {RECONNECT_DELAY}s")
            await asyncio.sleep(RECONNECT_DELAY)


def start_vessel_stream():
    """Called once on API startup to launch the background collector."""
    asyncio.create_task(_stream_vessels())


@router.get("/vessels")
async def get_vessels():
    # Purge vessels not seen in the last 5 minutes
    cutoff = time.time() - 300
    stale  = [mmsi for mmsi, v in _vessel_cache.items() if v.get("last_seen", 0) < cutoff]
    for mmsi in stale:
        del _vessel_cache[mmsi]

    return list(_vessel_cache.values())