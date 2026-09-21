# AI REGION BRIEFING
# Aggregates all active data layers for a region and generates a structured
# intelligence summary using a free LLM (Groq's llama3-8b-8192, zero cost).
# Falls back to a rule-based summary if no API key is set.

import os
import time
import hashlib
import json
from dataclasses import dataclass

import httpx

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama3-8b-8192"

_briefing_cache: dict[str, dict] = {}
CACHE_TTL = 300  # 5 minutes


@dataclass
class RegionContext:
    lat:         float
    lon:         float
    radius_km:   float
    earthquakes: list[dict]
    flights:     list[dict]
    vessels:     list[dict]
    fires:       list[dict]
    anomalies:   list[dict]
    launches:    list[dict]


def filter_region(items: list[dict], lat: float, lon: float, radius_km: float) -> list[dict]:
    """Return items within radius_km of (lat, lon)."""
    import math

    def dist(a_lat: float, a_lon: float) -> float:
        R   = 6371
        d1  = math.radians(a_lat - lat)
        d2  = math.radians(a_lon - lon)
        a   = math.sin(d1 / 2) ** 2 + math.cos(math.radians(lat)) * math.cos(math.radians(a_lat)) * math.sin(d2 / 2) ** 2
        return 2 * R * math.asin(math.sqrt(a))

    result = []
    for item in items:
        item_lat = item.get("lat") if "lat" in item else item.get("latitude")
        item_lon = item.get("lon") if "lon" in item else item.get("longitude")
        if item_lat is None or item_lon is None:
            continue
        if dist(float(item_lat), float(item_lon)) <= radius_km:
            result.append(item)
    return result


def build_context_summary(ctx: RegionContext) -> str:
    """Build a plain-text data summary for the LLM prompt."""
    lines = [
        f"Region: {ctx.lat:.3f}°N, {ctx.lon:.3f}°E, radius {ctx.radius_km:.0f} km",
        "",
    ]

    if ctx.earthquakes:
        max_mag = max(q.get("mag", 0) or 0 for q in ctx.earthquakes)
        lines.append(f"Seismic: {len(ctx.earthquakes)} earthquake(s), max magnitude {max_mag:.1f}.")
        for q in ctx.earthquakes[:3]:
            lines.append(f"  - M{q.get('mag', 0):.1f} at depth {q.get('depth_km', 0):.0f} km near {q.get('place', 'unknown')}")

    airborne = [f for f in ctx.flights if not f.get("on_ground")]
    if airborne:
        military = [f for f in airborne if f.get("is_military")]
        lines.append(f"Aviation: {len(airborne)} airborne aircraft ({len(military)} military).")

    if ctx.vessels:
        dark = [v for v in ctx.vessels if v.get("dark")]
        lines.append(f"Maritime: {len(ctx.vessels)} vessel(s) tracked ({len(dark)} dark/non-reporting).")

    if ctx.fires:
        total_frp = sum(f.get("frp", 0) or 0 for f in ctx.fires)
        lines.append(f"Fires: {len(ctx.fires)} active detection(s), total FRP {total_frp:.0f} MW.")

    upcoming = [l for l in ctx.launches if l.get("status", "").lower() in ("go", "tbc", "tbd")]
    if upcoming:
        lines.append(f"Launches: {len(upcoming)} upcoming launch(es) from pads in this region.")
        for l in upcoming[:2]:
            lines.append(f"  - {l.get('name', '?')} via {l.get('vehicle', '?')} from {l.get('pad', '?')}")

    if ctx.anomalies:
        critical = [a for a in ctx.anomalies if a.get("severity") in ("critical", "high")]
        lines.append(f"Anomalies: {len(ctx.anomalies)} active ({len(critical)} high/critical severity).")
        for a in ctx.anomalies[:3]:
            lines.append(f"  - [{a.get('severity', '?').upper()}] {a.get('title', '?')}")

    if len(lines) <= 2:
        lines.append("No significant activity detected in this region across monitored data feeds.")

    return "\n".join(lines)


def fallback_briefing(ctx: RegionContext) -> dict:
    """
    Rule-based briefing when no LLM key is available.
    Produces a structured summary without AI generation.
    """
    sections = []

    if ctx.earthquakes:
        max_mag = max(q.get("mag", 0) or 0 for q in ctx.earthquakes)
        sev     = "significant" if max_mag >= 5.0 else "minor"
        sections.append(
            f"Seismic monitoring shows {len(ctx.earthquakes)} {sev} event(s) "
            f"within {ctx.radius_km:.0f} km of this region, with a maximum "
            f"recorded magnitude of {max_mag:.1f}."
        )

    airborne = [f for f in ctx.flights if not f.get("on_ground")]
    if airborne:
        military = [f for f in airborne if f.get("is_military")]
        mil_note = f" including {len(military)} military aircraft" if military else ""
        sections.append(
            f"Aviation activity registers {len(airborne)} airborne aircraft{mil_note} "
            f"transiting or operating in this sector."
        )

    if ctx.vessels:
        dark = [v for v in ctx.vessels if v.get("dark")]
        dark_note = f" {len(dark)} vessel(s) are currently dark (AIS signal lost)." if dark else ""
        sections.append(
            f"Maritime traffic shows {len(ctx.vessels)} vessel(s) in the area.{dark_note}"
        )

    if ctx.fires:
        total_frp = sum(f.get("frp", 0) or 0 for f in ctx.fires)
        sections.append(
            f"NASA FIRMS reports {len(ctx.fires)} active fire detection(s) "
            f"with a combined fire radiative power of {total_frp:.0f} MW."
        )

    if ctx.anomalies:
        critical = [a for a in ctx.anomalies if a.get("severity") in ("critical", "high")]
        if critical:
            sections.append(
                f"The anomaly engine has flagged {len(critical)} high-priority event(s) "
                f"requiring attention: {', '.join(a.get('title', '') for a in critical[:2])}."
            )

    if not sections:
        summary = (
            "No significant activity detected across monitored data feeds for this region. "
            "Seismic, aviation, maritime, fire, and anomaly layers all report within normal parameters."
        )
    else:
        summary = " ".join(sections)

    sources = []
    if ctx.earthquakes: sources.append("USGS")
    if airborne:        sources.append("OpenSky")
    if ctx.vessels:     sources.append("AISStream")
    if ctx.fires:       sources.append("NASA FIRMS")
    if ctx.anomalies:   sources.append("ASTRA Anomaly Engine")

    return {
        "summary":    summary,
        "sources":    sources,
        "ai":         False,
        "model":      None,
        "context":    build_context_summary(ctx),
    }


async def generate_briefing(ctx: RegionContext) -> dict:
    """
    Generate an AI briefing using Groq's free API tier.
    Falls back to rule-based if GROQ_API_KEY is not set.
    """
    cache_key = hashlib.md5(
        f"{ctx.lat:.2f}_{ctx.lon:.2f}_{ctx.radius_km}_{int(time.time() // 300)}".encode()
    ).hexdigest()

    if cache_key in _briefing_cache:
        return _briefing_cache[cache_key]

    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        result = fallback_briefing(ctx)
        _briefing_cache[cache_key] = result
        return result

    context_text = build_context_summary(ctx)

    prompt = f"""You are an intelligence analyst reviewing live geospatial data feeds.
Write a concise two-paragraph intelligence briefing for the following region.

First paragraph: summarise current activity across all monitored feeds.
Second paragraph: highlight anything anomalous, note what to watch, and assess overall threat level as one of: ROUTINE / ELEVATED / HIGH / CRITICAL.

Be specific, factual, and direct. Use active voice. No preamble.

REGION DATA:
{context_text}

BRIEFING:"""

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":       GROQ_MODEL,
                    "messages":    [{"role": "user", "content": prompt}],
                    "max_tokens":  350,
                    "temperature": 0.3,
                },
            )
            r.raise_for_status()
            data    = r.json()
            summary = data["choices"][0]["message"]["content"].strip()

            sources = []
            if ctx.earthquakes: sources.append("USGS")
            if ctx.flights:     sources.append("OpenSky")
            if ctx.vessels:     sources.append("AISStream")
            if ctx.fires:       sources.append("NASA FIRMS")
            if ctx.anomalies:   sources.append("ASTRA Anomaly Engine")

            result = {
                "summary": summary,
                "sources": sources,
                "ai":      True,
                "model":   GROQ_MODEL,
                "context": context_text,
            }

    except Exception as e:
        result = fallback_briefing(ctx)
        result["error"] = str(e)

    _briefing_cache[cache_key] = result
    return result