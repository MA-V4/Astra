from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routes import satellites, flights, earthquakes, fires, launches, anomalies, vessels
from .routes import change_detection, briefing, history
from .routes.vessels import start_vessel_stream
from .services.history import run_snapshot_loop, init_db

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    init_db()
    start_vessel_stream()

    from .routes.flights     import _flight_cache
    from .routes.earthquakes import _quake_cache
    from .routes.fires       import _fire_cache

    asyncio.create_task(run_snapshot_loop(
        get_flights     = lambda: _flight_cache,
        get_earthquakes = lambda: _quake_cache,
        get_fires       = lambda: _fire_cache,
    ))
    yield


app = FastAPI(title="ASTRA API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(satellites.router)
app.include_router(flights.router)
app.include_router(earthquakes.router)
app.include_router(fires.router)
app.include_router(launches.router)
app.include_router(anomalies.router)
app.include_router(vessels.router)
app.include_router(change_detection.router)
app.include_router(briefing.router)
app.include_router(history.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "astra-api"}