# ASTRA

**Orbital intelligence. Live geospatial data from the perspective of space.**

ASTRA renders Earth from orbit with live satellite positions, flight data, seismic activity, and active fires — and adds an analysis layer that surfaces anomalies, cross-layer correlations, and AI-generated region briefings that God's Eye View does not have.

## Architecture

```
apps/
  web/   Next.js + Three.js + React Three Fiber
  api/   FastAPI — proxies and caches all live data feeds
packages/
  shared/  TypeScript types shared between web and API
```

## Data sources — all free

| Feed | Source | Key required |
|---|---|---|
| Satellite TLEs | CelesTrak | No |
| Live flights | OpenSky Network | No (optional for more credits) |
| Earthquakes | USGS | No |
| Active fires | NASA FIRMS | Free key |
| Launches | Launch Library 2 | No |
| Live vessels | AISStream | Free key (Phase 2) |

## Quick start

```bash
# API
cd apps/api
pip install -e .
uvicorn src.main:app --reload --port 8000

# Web (new terminal)
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000. The orbital satellite shell loads first.

## Phases

- [ ] Phase 0: Skeleton — Three.js globe, satellite layer, flight layer, all data feeds wired
- [ ] Phase 1: Orbital view — full satellite catalog, debris field, sensor footprint cones
- [ ] Phase 2: Anomaly detection — vessel dark events, flight deviations, seismic swarms
- [ ] Phase 3: Change detection — Sentinel-2 imagery diff for any region
- [ ] Phase 4: Intelligence briefings — AI region summary from all active layers
- [ ] Phase 5: Historical playback — 30-day position archive, scrub back in time

## License

MIT
