"use client"

import { useState } from "react"
import { ChangeDetectionPanel } from "@/components/panels/ChangeDetectionPanel"
import { BriefingPanel }        from "@/components/panels/BriefingPanel"

export function ViewControls() {
  const [cdOpen,  setCdOpen]  = useState(false)
  const [briOpen, setBriOpen] = useState(false)

  return (
    <>
      <div className="absolute top-14 right-4 mt-2 flex flex-col gap-1 z-10">
        <button
          onClick={() => { setBriOpen(v => !v); if (cdOpen) setCdOpen(false) }}
          className={[
            "px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all",
            briOpen
              ? "bg-stellar/15 border-stellar/40 text-stellar"
              : "glass border-white/10 text-white/30 hover:text-white/60",
          ].join(" ")}
        >
          ◉ Briefing
        </button>
        <button
          onClick={() => { setCdOpen(v => !v); if (briOpen) setBriOpen(false) }}
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

      {briOpen && <BriefingPanel />}
      {cdOpen  && <ChangeDetectionPanel />}
    </>
  )
}