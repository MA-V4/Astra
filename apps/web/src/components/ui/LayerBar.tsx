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
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 glass rounded-full px-3 py-2 z-10">
      {layers.map(layer => (
        <button
          key={layer.id}
          onClick={() => toggleLayer(layer.id as LayerId)}
          title={layer.label}
          className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all",
            layer.enabled
              ? "text-white"
              : "text-white/25 hover:text-white/50",
          ].join(" ")}
          style={layer.enabled ? { color: layer.color } : {}}
        >
          <span>{ICONS[layer.id as LayerId]}</span>
          <span className="hidden sm:inline tracking-widest uppercase text-[10px]">
            {layer.label.split(" ")[0]}
          </span>
          {layer.count > 0 && layer.enabled && (
            <span className="text-[10px] opacity-60">{layer.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
