"use client"

import { useAstraStore } from "@/store"
import type { LayerId } from "@/types"

const ICONS: Record<LayerId, string> = {
  satellites:       "◉",
  debris:           "◌",
  flights:          "✈",
  military_flights: "✦",
  vessels:          "⬡",
  earthquakes:      "⚡",
  fires:            "▲",
  launches:         "◎",
  anomalies:        "◈",
}

export function LayerBar() {
  const { layers, toggleLayer } = useAstraStore()

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-px z-10"
      style={{
        background: "rgba(4,10,20,0.8)",
        border:     "1px solid rgba(40,80,140,0.2)",
        borderRadius: 6,
        padding: "4px 8px",
        backdropFilter: "blur(16px)",
      }}>
      {layers.map((layer, i) => (
        <button
          key={layer.id}
          onClick={() => toggleLayer(layer.id as LayerId)}
          title={layer.label}
          className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:bg-white/5"
          style={{ opacity: layer.enabled ? 1 : 0.25 }}
        >
          <span className="text-[10px]" style={{ color: layer.enabled ? layer.color : "rgba(255,255,255,0.4)" }}>
            {ICONS[layer.id as LayerId]}
          </span>
          <span className="mono text-[8px] tracking-widest uppercase hidden sm:inline"
            style={{ color: layer.enabled ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)" }}>
            {layer.label.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  )
}