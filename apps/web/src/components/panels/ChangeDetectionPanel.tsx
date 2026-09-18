"use client"

import { useState } from "react"
import { useAstraStore } from "@/store"

interface ChangeResult {
  lat:             number
  lon:             number
  radius_km:       number
  date_before:     string
  date_after:      string
  change_score:    number
  change_area_km2: number
  change_type:     string
  confidence:      string
  description:     string
  before_product:  string | null
  after_product:   string | null
  error:           string | null
  bbox: { min_lat: number; min_lon: number; max_lat: number; max_lon: number }
}

const TYPE_ICONS: Record<string, string> = {
  construction: "🏗",
  vegetation:   "🌿",
  water:        "💧",
  fire:         "🔥",
  unknown:      "◈",
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   "#00FFB2",
  medium: "#FFB84D",
  low:    "#4DA6FF",
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score > 0.6 ? "#FF4D6D" : score > 0.3 ? "#FFB84D" : "#00FFB2"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-white/40">CHANGE INTENSITY</span>
        <span style={{ color }} className="font-semibold">{pct}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export function ChangeDetectionPanel() {
  const { camera } = useAstraStore()

  const today      = new Date().toISOString().slice(0, 10)
  const thirtyAgo  = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)

  const [lat,    setLat]    = useState(camera.lat.toFixed(4))
  const [lon,    setLon]    = useState(camera.lon.toFixed(4))
  const [radius, setRadius] = useState("50")
  const [before, setBefore] = useState(thirtyAgo)
  const [after,  setAfter]  = useState(today)
  const [result, setResult] = useState<ChangeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  async function run() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const url = `${API}/change-detection?lat=${lat}&lon=${lon}&radius=${radius}&before=${before}&after=${after}`
      const r   = await fetch(url)
      const d   = await r.json()
      if (!r.ok) throw new Error(d.detail ?? `HTTP ${r.status}`)
      if (d.error) throw new Error(d.error)
      setResult(d)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute top-14 right-4 bottom-16 w-80 glass rounded-xl overflow-hidden z-10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-aurora" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            Change Detection
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/25">Sentinel-2</span>
      </div>

      <div className="px-4 py-4 border-b border-white/5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-mono text-white/35 uppercase tracking-widest block mb-1">Lat</label>
            <input
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white/80 focus:outline-none focus:border-stellar/50"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-white/35 uppercase tracking-widest block mb-1">Lon</label>
            <input
              value={lon}
              onChange={e => setLon(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white/80 focus:outline-none focus:border-stellar/50"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] font-mono text-white/35 uppercase tracking-widest block mb-1">
            Radius (km)
          </label>
          <input
            type="range" min="10" max="200" value={radius}
            onChange={e => setRadius(e.target.value)}
            className="w-full accent-stellar"
          />
          <div className="text-right text-[9px] font-mono text-stellar/60 mt-0.5">{radius} km</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-mono text-white/35 uppercase tracking-widest block mb-1">Before</label>
            <input
              type="date" value={before}
              onChange={e => setBefore(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white/80 focus:outline-none focus:border-stellar/50"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-white/35 uppercase tracking-widest block mb-1">After</label>
            <input
              type="date" value={after}
              onChange={e => setAfter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white/80 focus:outline-none focus:border-stellar/50"
            />
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="w-full py-2 rounded-lg text-xs font-mono font-semibold uppercase tracking-widest transition-all disabled:opacity-40 bg-aurora/15 border border-aurora/30 text-aurora hover:bg-aurora/25"
        >
          {loading ? "Analysing..." : "Run Analysis"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <div className="bg-alert/10 border border-alert/30 rounded-lg px-3 py-3 text-xs font-mono text-alert/80">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="w-6 h-6 border-2 border-aurora/30 border-t-aurora rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-white/30">Querying Copernicus catalogue...</span>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{TYPE_ICONS[result.change_type] ?? "◈"}</span>
              <div>
                <div className="text-sm font-mono font-semibold text-white capitalize">
                  {result.change_type.replace("_", " ")} change
                </div>
                <div
                  className="text-[10px] font-mono uppercase tracking-widest mt-0.5"
                  style={{ color: CONFIDENCE_COLOR[result.confidence] }}
                >
                  {result.confidence} confidence
                </div>
              </div>
            </div>

            <ScoreBar score={result.change_score} />

            <div className="space-y-1.5">
              {[
                ["Affected area", `${result.change_area_km2.toFixed(0)} km²`],
                ["Date range",    `${result.date_before} → ${result.date_after}`],
                ["Radius",        `${result.radius_km} km`],
                ["Position",      `${result.lat.toFixed(3)}°, ${result.lon.toFixed(3)}°`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest">{label}</span>
                  <span className="text-[10px] font-mono text-white/70">{value}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-mono text-white/40 leading-relaxed">
              {result.description}
            </p>

            {result.before_product && (
              <div className="bg-white/3 border border-white/8 rounded-lg px-3 py-2">
                <div className="text-[9px] font-mono text-white/25 mb-1">BEFORE PRODUCT ID</div>
                <div className="text-[9px] font-mono text-stellar/50 truncate">{result.before_product}</div>
              </div>
            )}

            <p className="text-[9px] font-mono text-white/20 leading-relaxed">
              Pixel-level comparison requires Copernicus CDSE authentication. Current analysis uses product metadata and cloud cover. Phase 4 adds authenticated imagery download.
            </p>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
            <span className="text-3xl opacity-30">◎</span>
            <p className="text-[10px] font-mono text-white/25 leading-relaxed max-w-48">
              Set a location and date range to analyse surface change from Sentinel-2 imagery.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}