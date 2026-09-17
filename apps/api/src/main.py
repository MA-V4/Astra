from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import satellites, flights, earthquakes, fires, launches, anomalies, vessels

app = FastAPI(title="ASTRA API", version="0.1.0")

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


@app.get("/health")
async def health():
    return {"status": "ok", "service": "astra-api"}
