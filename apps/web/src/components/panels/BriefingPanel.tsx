"use client"

import { useState, useCallback } from "react"
import { useAstraStore } from "@/store"

interface BriefingResult {
  summary: string
  sources: string[]
  ai:      boolean
  model:   string | null
  context: string
  error?:  string
}

function ThreatBadge({ text }: { text: string }) {
  const upper = text.toUpperCase()
  const level =
    upper.includes("CRITICAL") ? "critical" :
    upper.includes("HIGH")     ? "high"     :
    upper.includes("ELEVATED") ? "elevated" : "routine"

  const styles = {
    critical: { bg: "rgba(255,26,51,0.15)",  border: "rgba(255,26,51,0.4)",  color: "#FF1A33", label: "CRITICAL" },
    high:     { bg: "rgba(255,107,53,0.15)", border: "rgba(255,107,53,0.4)", color: "#FF6B35", label: "HIGH" },
    elevated: { bg: "rgba(255,184,77,0.15)", border: "rgba(255,184,77,0.4)", color: "#FFB84D", label: "ELEVATED" },
    routine:  { bg: "rgba(0,255,178,0.10)",  border: "rgba(0,255,178,0.3)",  color: "#00FFB2", label: "ROUTINE" },
  }[level]

  return (
    <span
      className="text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded border"
      style={{ background: styles.bg, borderColor: styles.border, color: styles.color }}
    >
      {styles.label}
    </span>
  )
}

function extractThreat(text: string): string | null {
  const match = text.match(/\b(ROUTINE|ELEVATED|HIGH|CRITICAL)\b/)
  return match ? match[1] : null
}

export function BriefingPanel() {
  const { camera } = useAstraStore()

  const [lat,     setLat]     = useState(camera.lat.toFixed(2))
  const [lon,     setLon]     = useState(camera.lon.toFixed(2))
  const [radius,  setRadius]  = useState("500")
  const [result,  setResult]  = useState<BriefingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [showCtx, setShowCtx] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await fetch(`${API}/briefing?lat=${lat}&lon=${lon}&radius=${radius}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail ?? `HTTP ${r.status}`)
      setResult(d)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [lat, lon, radius, API])

  const threat = result ? extractThreat(result.summary) : null

  return (
    <div className="absolute top-14 left-4 bottom-16 w-80 glass rounded-xl overflow-hidden z-10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-stellar" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            Intelligence Briefing
          </span>
        </div>
        {result?.ai && (
          <span className="text-[9px] font-mono text-aurora/50">{result.model}</span>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-white/5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest block mb-1">Lat</label>
            <input
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white/80 focus:outline-none focus:border-stellar/40"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest block mb-1">Lon</label>
            <input
              value={lon}
              onChange={e => setLon(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white/80 focus:outline-none focus:border-stellar/40"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Radius</label>
            <span className="text-[9px] font-mono text-stellar/50">{radius} km</span>
          </div>
          <input
            type="range" min="50" max="2000" step="50" value={radius}
            onChange={e => setRadius(e.target.value)}
            className="w-full accent-stellar"
          />
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="w-full py-2 rounded-lg text-xs font-mono font-semibold uppercase tracking-widest transition-all disabled:opacity-40 bg-stellar/15 border border-stellar/30 text-stellar hover:bg-stellar/25"
        >
          {loading ? "Generating..." : "Generate Briefing"}
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <div className="bg-alert/10 border border-alert/30 rounded-lg px-3 py-3 text-xs font-mono text-alert/80">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-6 h-6 border-2 border-stellar/30 border-t-stellar rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-[10px] font-mono text-white/30">Aggregating data feeds...</p>
              <p className="text-[9px] font-mono text-white/15">
                {result?.ai ? "LLM generating briefing" : "Processing region context"}
              </p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            {/* Threat level */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Threat Assessment</span>
              {threat && <ThreatBadge text={threat} />}
            </div>

            {/* Briefing text */}
            <div className="space-y-3">
              {result.summary.split("\n\n").filter(Boolean).map((para, i) => (
                <p key={i} className="text-xs font-mono text-white/70 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* Sources */}
            {result.sources.length > 0 && (
              <div>
                <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest mb-1.5">Sources</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.sources.map(s => (
                    <span key={s} className="text-[9px] font-mono text-white/35 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI badge */}
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${result.ai ? "bg-aurora" : "bg-stellar"}`} />
              <span className="text-[9px] font-mono text-white/25">
                {result.ai ? `AI-generated via ${result.model}` : "Rule-based summary (set GROQ_API_KEY for AI)"}
              </span>
            </div>

            {/* Raw context toggle */}
            <button
              onClick={() => setShowCtx(v => !v)}
              className="text-[9px] font-mono text-white/20 hover:text-white/40 transition-colors"
            >
              {showCtx ? "Hide" : "Show"} raw data context
            </button>

            {showCtx && (
              <pre className="text-[9px] font-mono text-white/30 leading-relaxed bg-white/3 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {result.context}
              </pre>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
            <span className="text-3xl opacity-30">◉</span>
            <p className="text-[10px] font-mono text-white/25 leading-relaxed max-w-52">
              Set a region and radius. ASTRA aggregates all active data layers and generates a structured intelligence summary.
            </p>
            <p className="text-[9px] font-mono text-white/15">
              Add GROQ_API_KEY to .env for AI-generated briefings.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}