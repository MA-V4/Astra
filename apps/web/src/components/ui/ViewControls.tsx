"use client"

import { useState } from "react"
import { ChangeDetectionPanel } from "@/components/panels/ChangeDetectionPanel"
import { BriefingPanel }        from "@/components/panels/BriefingPanel"

export function ViewControls() {
  const [cdOpen,  setCdOpen]  = useState(false)
  const [briOpen, setBriOpen] = useState(false)

  return (
    <>
      <div className="absolute top-12 right-3 flex flex-col gap-1 z-10">
        <Btn
          label="◉ BRIEFING"
          active={briOpen}
          color="#3D9BE9"
          onClick={() => { setBriOpen(v => !v); if (cdOpen) setCdOpen(false) }}
        />
        <Btn
          label="◎ CHANGE DETECTION"
          active={cdOpen}
          color="#00E5A0"
          onClick={() => { setCdOpen(v => !v); if (briOpen) setBriOpen(false) }}
        />
      </div>
      {briOpen && <BriefingPanel />}
      {cdOpen  && <ChangeDetectionPanel />}
    </>
  )
}

function Btn({ label, active, color, onClick }: {
  label: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 mono text-[9px] tracking-widest uppercase transition-all text-right"
      style={{
        color:      active ? color : "rgba(255,255,255,0.2)",
        background: active ? `${color}12` : "transparent",
        border:     `1px solid ${active ? color + "40" : "rgba(40,80,140,0.15)"}`,
        borderRadius: 4,
      }}
    >
      {label}
    </button>
  )
}