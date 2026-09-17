"use client"

import { useAstraStore } from "@/store"

export function StatusBar() {
  const { satellites, flights, earthquakes, anomalies, lastUpdate } = useAstraStore()

  return (
    <div className="absolute bottom-0 left-0 right-0 h-6 glass flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-6 text-[10px] font-mono text-white/30">
        <span>
          <span className="text-aurora/60">● </span>LIVE
        </span>
        <span>DATA: CELESTRAK · OPENSKY · USGS · NASA FIRMS</span>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
        {anomalies.length > 0 && (
          <span className="text-alert/70">
            {anomalies.length} ANOMAL{anomalies.length === 1 ? "Y" : "IES"}
          </span>
        )}
        <span>
          UPDATED{" "}
          {lastUpdate
            ? new Date(lastUpdate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "--:--:--"}
        </span>
      </div>
    </div>
  )
}
