"use client"

import { useState } from "react"
import { ChangeDetectionPanel } from "@/components/panels/ChangeDetectionPanel"

export function ViewControls() {
  const [cdOpen, setCdOpen] = useState(false)

  return (
    <>
      <div className="absolute top-14 right-4 mt-2 flex flex-col gap-1 z-10">
        <button
          onClick={() => setCdOpen(v => !v)}
          className={[
            "px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all",
            cdOpen
              ? "bg-aurora/15 border-aurora/40 text-aurora"
              : "glass border-white/10 text-white/30 hover:text-white/60",
          ].join(" ")}
        >
          ◎ Change Detection
        </button>
      </div>

      {cdOpen && <ChangeDetectionPanel />}
    </>
  )
}