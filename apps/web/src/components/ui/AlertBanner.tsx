"use client"

import { useAstraStore } from "@/store"

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  critical: { bg: "bg-alert/10",  border: "border-alert/40",  text: "text-alert",  dot: "bg-alert" },
  high:     { bg: "bg-[#FF6B35]/10", border: "border-[#FF6B35]/40", text: "text-[#FF6B35]", dot: "bg-[#FF6B35]" },
  medium:   { bg: "bg-orbit/10",  border: "border-orbit/40",  text: "text-orbit",  dot: "bg-orbit" },
  low:      { bg: "bg-stellar/10", border: "border-stellar/40", text: "text-stellar", dot: "bg-stellar" },
}

export function AlertBanner() {
  const { anomalies, setSelected, layers } = useAstraStore()
  const enabled = layers.find(l => l.id === "anomalies")?.enabled ?? true

  if (!enabled || anomalies.length === 0) return null

  const top = anomalies[0]
  const style = SEVERITY_STYLES[top.severity] ?? SEVERITY_STYLES.low

  return (
    <div
      onClick={() => setSelected({ kind: "anomaly", data: top })}
      className={`
        absolute top-14 left-1/2 -translate-x-1/2 mt-2
        flex items-center gap-3 px-4 py-2.5 rounded-full
        glass cursor-pointer border transition-all hover:scale-105
        ${style.bg} ${style.border} z-20
      `}
    >
      <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${style.dot}`} />
      <span className={`text-xs font-mono font-semibold uppercase tracking-widest ${style.text}`}>
        {top.severity}
      </span>
      <span className="text-xs font-mono text-white/60 max-w-xs truncate">{top.title}</span>
      {anomalies.length > 1 && (
        <span className="text-[10px] font-mono text-white/30">
          +{anomalies.length - 1} more
        </span>
      )}
    </div>
  )
}