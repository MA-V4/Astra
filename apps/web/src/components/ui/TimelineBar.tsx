"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAstraStore } from "@/store"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function formatUTC(ts: number): string {
  return new Date(ts * 1000).toUTCString().slice(5, 22)
}

function formatAge(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export function TimelineBar() {
  const { playback, setPlayback, exitPlayback, setFlights, setEarthquakes, setFires } = useAstraStore()
  const [dragging, setDragging]   = useState(false)
  const [loading,  setLoading]    = useState(false)
  const barRef                    = useRef<HTMLDivElement>(null)
  const seekTimeout               = useRef<NodeJS.Timeout>()

  // Fetch available range on mount
  useEffect(() => {
    fetch(`${API}/history/range`)
      .then(r => r.json())
      .then(d => setPlayback({ range: d }))
      .catch(() => {})
  }, [])

  const range    = playback.range
  const duration = range ? range.latest - range.earliest : 0
  const pct      = range && duration > 0
    ? Math.max(0, Math.min(1, (playback.ts - range.earliest) / duration))
    : 1

  const seekTo = useCallback(async (ts: number) => {
    setPlayback({ ts, active: true })
    clearTimeout(seekTimeout.current)
    seekTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`${API}/history?ts=${ts}`)
        const d = await r.json()
        if (d.flights)     setFlights(d.flights)
        if (d.earthquakes) setEarthquakes(d.earthquakes)
        if (d.fires)       setFires(d.fires)
      } catch {}
      setLoading(false)
    }, 200)
  }, [setPlayback, setFlights, setEarthquakes, setFires])

  function onBarClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!range || duration <= 0) return
    const rect = barRef.current!.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seekTo(range.earliest + frac * duration)
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging || !range || !barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seekTo(range.earliest + frac * duration)
  }

  useEffect(() => {
    if (!dragging) return
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup",  () => setDragging(false))
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup",  () => setDragging(false))
    }
  }, [dragging, onMouseMove])

  if (!range || duration === 0) return null

  return (
    <div className="absolute bottom-[56px] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] z-20">
      <div className="glass rounded-xl px-4 py-3 space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Playback
            </span>
            {playback.active && (
              <span className="text-[9px] font-mono text-orbit/70 px-1.5 py-0.5 rounded bg-orbit/10 border border-orbit/20">
                HISTORY
              </span>
            )}
            {loading && (
              <div className="w-3 h-3 border border-stellar/30 border-t-stellar rounded-full animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {playback.active && (
              <button
                onClick={exitPlayback}
                className="text-[9px] font-mono text-aurora/70 hover:text-aurora transition-colors uppercase tracking-widest"
              >
                ◉ Live
              </button>
            )}
            <span className="text-[10px] font-mono text-white/40">
              {playback.active ? formatUTC(playback.ts) : "LIVE"}
            </span>
          </div>
        </div>

        {/* Scrubber track */}
        <div
          ref={barRef}
          onClick={onBarClick}
          onMouseDown={() => setDragging(true)}
          className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
        >
          {/* Filled portion */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-stellar/50 transition-all duration-100"
            style={{ width: `${pct * 100}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-stellar border border-stellar/50 shadow-lg transition-all"
            style={{ left: `${pct * 100}%` }}
          />
        </div>

        {/* Time labels */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-white/25">
            {formatAge(range.earliest)} (oldest)
          </span>
          <span className="text-[9px] font-mono text-white/25">
            NOW
          </span>
        </div>
      </div>
    </div>
  )
}