"use client"

import { useAstraStore } from "@/store"
import type { Anomaly } from "@/types"

const SEVERITY_CONFIG = {
  critical: { label: "CRITICAL", color: "#FF1A33", bg: "rgba(255,26,51,0.1)",  border: "rgba(255,26,51,0.3)"  },
  high:     { label: "HIGH",     color: "#FF6B35", bg: "rgba(255,107,53,0.1)", border: "rgba(255,107,53,0.3)" },
  medium:   { label: "MEDIUM",   color: "#FFB84D", bg: "rgba(255,184,77,0.1)", border: "rgba(255,184,77,0.3)" },
  low:      { label: "LOW",      color: "#4DA6FF", bg: "rgba(77,166,255,0.1)", border: "rgba(77,166,255,0.3)" },
}

const TYPE_ICONS: Record<string, string> = {
  seismic_swarm:    "⚡",
  vessel_dark:      "⬡",
  unusual_flight_path: "✈",
  activity_cluster: "◈",
  launch_window:    "◎",
}

function AnomalyCard({ anomaly, onClick }: { anomaly: Anomaly; onClick: () => void }) {
  const cfg = SEVERITY_CONFIG[anomaly.severity] ?? SEVERITY_CONFIG.low

  return (
    <div
      onClick={onClick}
      className="rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.01] border"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="flex items-start gap-2.5 mb-1.5">
        <span className="text-sm mt-0.5">{TYPE_ICONS[anomaly.type] ?? "◉"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded"
              style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
          </div>
          <div className="text-xs font-mono font-semibold text-white/85 leading-tight">
            {anomaly.title}
          </div>
        </div>
      </div>
      <p className="text-[10px] font-mono text-white/45 leading-relaxed ml-6">
        {anomaly.description}
      </p>
      <div className="flex items-center justify-between mt-2 ml-6">
        <span className="text-[9px] font-mono text-white/25">
          {anomaly.layers.join(" · ").toUpperCase()}
        </span>
        <span className="text-[9px] font-mono text-white/25">
          {new Date(anomaly.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
        </span>
      </div>
    </div>
  )
}

export function AnomalyPanel() {
  const { anomalies, selected, setSelected, layers } = useAstraStore()
  const enabled = layers.find(l => l.id === "anomalies")?.enabled ?? true

  if (!enabled || anomalies.length === 0) return null

  return (
    <div className="absolute top-14 left-4 bottom-16 w-72 glass rounded-xl overflow-hidden z-10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-alert animate-pulse" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            Anomalies
          </span>
        </div>
        <span className="text-[10px] font-mono text-alert/70 font-semibold">
          {anomalies.length} ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {anomalies.map(a => (
          <AnomalyCard
            key={a.id}
            anomaly={a}
            onClick={() => setSelected({ kind: "anomaly", data: a })}
          />
        ))}
      </div>
    </div>
  )
}