# ANOMALY DETECTION
# Cross-layer analysis: seismic swarms, activity clusters, vessel dark events, flight deviations.
# Called by the anomaly route on each request.

import math
import time
from dataclasses import dataclass, field
from typing import Any

@dataclass
class Anomaly:
    id:                str
    type:              str 
    severity:          str 
    title:             str 
    description:       str 
    lat:               float 
    lon:               float
    timestamp:         float 
    layers:            list[str] = field(default_factory=list) 
    meta:              dict = field(default_factory=dict)  


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km."""
    R  = 6371
    d1 = math.radians(lat2 - lat1)
    d2 = math.radians(lon2 - lon1)
    a  = math.sin(d1 / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d2 / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def detect_seismic_swarms(earthquakes: list[dict]) -> list[Anomaly]:
    """
    Flag clusters of 3+ earthquakes within 200km and 1 hour of each other.
    Severity scales with count and max magnitude.
    """
    anomalies: list[Anomaly] = []
    now       = time.time() * 1000
    recent    = [q for q in earthquakes if now - q.get("time", 0) < 3_600_000]

    used = set()
    for i, quake in enumerate(recent):
        if i in used:
            continue

        cluster   = [quake]
        cluster_i = {i}

        for j, other in enumerate(recent):
            if j == i or j in used:
                continue
            dist = haversine(quake["lat"], quake["lon"], other["lat"], other["lon"])
            if dist < 200:
                cluster.append(other)
                cluster_i.add(j)

        if len(cluster) < 3:
            continue

        used |= cluster_i
        max_mag  = max(q["mag"] for q in cluster)
        avg_lat  = sum(q["lat"] for q in cluster) / len(cluster)
        avg_lon  = sum(q["lon"] for q in cluster) / len(cluster)
        place    = cluster[0].get("place", "Unknown region")

        severity = "low"
        if len(cluster) >= 5 or max_mag >= 5.0:
            severity = "medium"
        if len(cluster) >= 8 or max_mag >= 6.0:
            severity = "high"
        if max_mag >= 7.0:
            severity = "critical"

        anomalies.append(Anomaly(
            id          = f"swarm_{i}_{int(now)}",
            type        = "seismic_swarm",
            severity    = severity,
            title       = f"Seismic swarm - {len(cluster)} events",
            description = f"{len(cluster)} earthquakes within 200 km in the past hour near {place}. Max magnitude {max_mag:.1f}.",
            lat         = avg_lat,
            lon         = avg_lon,
            timestamp   = now / 1000,
            layers      = ["earthquakes"],
            meta        = { "count": len(cluster), "max_mag": max_mag },
        ))

    return anomalies


def detect_activity_clusters(flights: list[dict], vessels: list[dict]) -> list[Anomaly]:
    """
    Flag unusual concentrations of aircraft or vessels in a region.
    Grid cells of ~500km x 500km. Flag cells with > 2x the average density.
    """
    anomalies: list[Anomaly] = []

    def grid_key(lat: float, lon: float, cell_deg: float = 5.0) -> tuple:
        return (int(lat / cell_deg), int(lon / cell_deg))

    # Flight clusters
    flight_cells: dict[tuple, list] = {}
    for f in flights:
        if f.get("on_ground") or f.get("latitude") is None:
            continue
        k = grid_key(f["latitude"], f["longitude"])
        flight_cells.setdefault(k, []).append(f)

    if flight_cells:
        avg = sum(len(v) for v in flight_cells.values()) / len(flight_cells)
        for (gi, gj), members in flight_cells.items():
            if len(members) > max(avg * 2.5, 30):
                lat = gi * 5.0 + 2.5
                lon = gj * 5.0 + 2.5
                anomalies.append(Anomaly(
                    id          = f"cluster_flights_{gi}_{gj}",
                    type        = "activity_cluster",
                    severity    = "low",
                    title       = f"High flight density - {len(members)} aircraft",
                    description = f"{len(members)} aircraft in a 500 km sector ({lat:.1f}°, {lon:.1f}°), {int(len(members) / avg * 100 - 100)}% above baseline.",
                    lat         = lat,
                    lon         = lon,
                    timestamp   = time.time(),
                    layers      = ["flights"],
                    meta        = { "count": len(members), "avg": avg },
                ))

    return anomalies


def detect_large_earthquakes(earthquakes: list[dict]) -> list[Anomaly]:
    """Flag any M6.0+ event in the last 24 hours as a standalone anomaly."""
    anomalies: list[Anomaly] = []
    cutoff = (time.time() - 86400) * 1000

    for q in earthquakes:
        if q.get("time", 0) < cutoff:
            continue
        mag = q.get("mag", 0) or 0
        if mag < 6.0:
            continue

        severity = "medium"
        if mag >= 6.5: severity = "high"
        if mag >= 8.0: severity = "critical"

        anomalies.append(Anomaly(
            id          = f"quake_major_{q['id']}",
            type        = "seismic_swarm",
            severity    = severity,
            title       = f"M{mag:.1f} earthquake - {q.get('place', 'unknown')}",
            description = f"Magnitude {mag:.1f} at depth {q.get('depth_km', 0):.0f} km. {'Tsunami alert issued.' if q.get('tsunami') else 'No tsunami alert.'}",
            lat         = q["lat"],
            lon         = q["lon"],
            timestamp   = q.get("time", time.time() * 1000) / 1000,
            layers      = ["earthquakes"],
            meta        = { "mag": mag, "depth_km": q.get("depth_km", 0), "tsunami": q.get("tsunami", False) },
        ))

    return anomalies


def detect_fire_clusters(fires: list[dict]) -> list[Anomaly]:
    """Flag dense fire clusters with high FRP (fire radiative power)."""
    anomalies: list[Anomaly] = []
    if not fires:
        return anomalies

    grid: dict[tuple, list] = {}
    for f in fires:
        k = (int(f["lat"] / 3), int(f["lon"] / 3))
        grid.setdefault(k, []).append(f)

    for (gi, gj), members in grid.items():
        if len(members) < 10:
            continue
        total_frp = sum(m.get("frp", 0) for m in members)
        if total_frp < 500:
            continue

        lat = gi * 3 + 1.5
        lon = gj * 3 + 1.5

        severity = "medium" if total_frp < 2000 else "high" if total_frp < 5000 else "critical"

        anomalies.append(Anomaly(
            id          = f"fire_{gi}_{gj}",
            type        = "activity_cluster",
            severity    = severity,
            title       = f"Major fire complex - {len(members)} detections",
            description = f"{len(members)} active fire detections in a 300 km sector. Total fire radiative power: {total_frp:.0f} MW.",
            lat         = lat,
            lon         = lon,
            timestamp   = time.time(),
            layers      = ["fires"],
            meta        = { "count": len(members), "total_frp": total_frp },
        ))

    return anomalies


def run_all(
    earthquakes: list[dict],
    flights:     list[dict],
    vessels:     list[dict],
    fires:       list[dict],
) -> list[dict]:
    anomalies: list[Anomaly] = []
    anomalies += detect_seismic_swarms(earthquakes)
    anomalies += detect_large_earthquakes(earthquakes)
    anomalies += detect_activity_clusters(flights, vessels)
    anomalies += detect_fire_clusters(fires)

    # Sort: critical first, then high, medium, low
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    anomalies.sort(key=lambda a: order.get(a.severity, 4))

    return [vars(a) for a in anomalies]