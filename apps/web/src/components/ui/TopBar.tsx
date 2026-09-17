"use client"

import { useAstraStore } from "@/store"
import { useEffect, useState } from "react"

function Clock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const fmt = () => {
      const n = new Date()
      setTime(
        n.toUTCString().slice(17, 25) + " UTC " +
        n.getFullYear() + "-" +
        String(n.getMonth() + 1).padStart(2, "0") + "-" +
        String(n.getDate()).padStart(2, "0")
      )
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-xs text-stellar/80">{time}</span>
}

export function TopBar() {
  const { satellites, flights, vessels, layers, setViewMode, camera } = useAstraStore()
  const satOn     = layers.find(l => l.id === "satellites")?.enabled
  const flightOn  = layers.find(l => l.id === "flights")?.enabled

  return (
    <div className="absolute top-0 left-0 right-0 h-12 glass flex items-center justify-between px-6 z-10">
      {/* Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 relative">
          <div className="absolute inset-0 rounded-full border border-aurora/60 animate-pulse_slow" />
          <div className="absolute inset-1 rounded-full border border-aurora/30" />
          <div className="absolute inset-[6px] rounded-full bg-aurora" />
        </div>
        <span className="font-mono font-semibold text-sm tracking-[0.2em] text-white">
          ASTRA
        </span>
        <span className="text-xs text-white/20 font-mono">ORBITAL INTELLIGENCE</span>
      </div>

      {/* Live stats */}
      <div className="flex items-center gap-6 text-xs font-mono">
        {satOn && (
          <span className="text-stellar">
            <span className="text-stellar/50">SAT </span>
            {satellites.length.toLocaleString()}
          </span>
        )}
        {flightOn && (
          <span className="text-aurora">
            <span className="text-aurora/50">FLT </span>
            {flights.filter(f => !f.on_ground).length.toLocaleString()}
          </span>
        )}
        <Clock />
      </div>

      {/* View mode switcher */}
      <div className="flex items-center gap-1">
        {(["orbital", "globe", "intelligence"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={[
              "px-3 py-1 rounded text-xs font-mono uppercase tracking-widest transition-all",
              camera.mode === mode
                ? "bg-stellar/20 text-stellar border border-stellar/40"
                : "text-white/30 hover:text-white/60",
            ].join(" ")}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  )
}
