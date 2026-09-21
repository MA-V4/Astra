"use client"

import { useAstraStore } from "@/store"

export function StatusBar() {
  const { anomalies, lastUpdate, playback } = useAstraStore()
  const crit = anomalies.filter(a => a.severity === "critical").length

  return (
    <div className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-between px-4 z-10 mono"
      style={{ background: "rgba(3,6,9,0.9)", borderTop: "1px solid rgba(40,80,140,0.15)" }}>
      <div className="flex items-center gap-4">
        <span className="text-[8px] text-[#00E5A0]/60 tracking-widest">● LIVE</span>
        <span className="text-[8px] text-white/20 tracking-widest">DATA: CELESTRAK · OPENSKY · USGS · NASA FIRMS</span>
      </div>
      <div className="flex items-center gap-4">
        {crit > 0 && (
          <span className="text-[8px] text-[#FF3355]/60 tracking-widest">
            {crit} CRITICAL
          </span>
        )}
        {playback.active && (
          <span className="text-[8px] text-[#F0A030]/60 tracking-widest">HISTORY MODE</span>
        )}
        <span className="text-[8px] text-white/20">
          {lastUpdate ? new Date(lastUpdate).toISOString().slice(11, 19) + " UTC" : "--:--:--"}
        </span>
      </div>
    </div>
  )
}