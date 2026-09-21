"use client"

import { useAstraStore } from "@/store"

const SEV_COLOR = {
  critical: "#FF3355",
  high:     "#FF6535",
  medium:   "#F0A030",
  low:      "#3D9BE9",
}

export function AlertBanner() {
  const { anomalies, layers } = useAstraStore()
  const enabled = layers.find(l => l.id === "anomalies")?.enabled ?? true
  if (!enabled || anomalies.length === 0) return null

  const top   = anomalies[0]
  const color = SEV_COLOR[top.severity as keyof typeof SEV_COLOR] ?? "#3D9BE9"
  const rest  = anomalies.length - 1

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 mt-1 flex items-center gap-2.5 px-3 py-1.5 rounded z-20 mono"
      style={{
        background: `rgba(${top.severity === "critical" ? "255,51,85" : top.severity === "high" ? "255,101,53" : "240,160,48"},0.08)`,
        border:     `1px solid ${color}30`,
      }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: color }} />
      <span className="text-[9px] font-medium tracking-widest uppercase" style={{ color }}>{top.severity}</span>
      <span className="text-[10px] text-white/50 max-w-xs truncate">{top.title}</span>
      {rest > 0 && <span className="text-[9px] text-white/20">+{rest}</span>}
    </div>
  )
}