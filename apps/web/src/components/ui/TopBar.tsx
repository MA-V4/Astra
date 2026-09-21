"use client"

import { useAstraStore } from "@/store"
import { useEffect, useState } from "react"

function Clock() {
  const [t, setT] = useState("")
  useEffect(() => {
    const fmt = () => {
      const n = new Date()
      const pad = (x: number) => String(x).padStart(2, "0")
      setT(`${pad(n.getUTCHours())}:${pad(n.getUTCMinutes())}:${pad(n.getUTCSeconds())} UTC ${n.getUTCFullYear()}-${pad(n.getUTCMonth()+1)}-${pad(n.getUTCDate())}`)
    }
    fmt(); const id = setInterval(fmt, 1000); return () => clearInterval(id)
  }, [])
  return <span className="mono text-[11px] text-white/40">{t}</span>
}

export function TopBar() {
  const { satellites, flights, camera, setViewMode } = useAstraStore()
  const airborne = flights.filter(f => !f.on_ground).length

  return (
    <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-5 z-10"
      style={{ background: "linear-gradient(to bottom, rgba(3,6,9,0.95), transparent)" }}>

      {/* Wordmark */}
      <div className="flex items-center gap-3">
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full border border-[#00E5A0]/40" />
          <div className="absolute inset-[3px] rounded-full bg-[#00E5A0]/80" />
        </div>
        <span className="mono text-[11px] font-medium tracking-[0.25em] text-white/90">ASTRA</span>
        <span className="mono text-[9px] text-white/20 tracking-widest">ORBITAL INTELLIGENCE</span>
      </div>

      {/* Live counters */}
      <div className="flex items-center gap-5">
        <Stat label="SAT" value={satellites.length} color="#3D9BE9" />
        <Stat label="FLT" value={airborne}           color="#00E5A0" />
        <Clock />
      </div>

      {/* View modes */}
      <div className="flex items-center gap-px">
        {(["orbital", "globe", "intelligence"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={[
              "px-3 h-6 mono text-[9px] tracking-widest uppercase transition-all",
              camera.mode === mode
                ? "text-white/80 bg-white/8 border-b border-[#3D9BE9]/60"
                : "text-white/25 hover:text-white/50",
            ].join(" ")}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mono text-[9px] text-white/25 tracking-widest">{label}</span>
      <span className="mono text-[11px] font-medium" style={{ color }}>{value.toLocaleString()}</span>
    </div>
  )
}