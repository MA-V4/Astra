"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PLANETS, realAngle, PLANET_MAP } from "@/lib/planets"
import type { Planet } from "@/lib/planets"
import { useAstraStore } from "@/store"

const MERCURY_PERIOD = 87.97
const ANIM_SCALE = (2 * Math.PI) / (MERCURY_PERIOD * 4000)

// Log-compressed display radius - only valid for AU > 0
function displayR(au: number, maxPx: number): number {
  const minAU = Math.log(0.387)
  const maxAU = Math.log(30.07)
  return 46 + ((Math.log(au) - minAU) / (maxAU - minAU)) * (maxPx - 46)
}

function drawSun(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // Outer glow
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32)
  g.addColorStop(0,   "rgba(255,240,100,0.95)")
  g.addColorStop(0.3, "rgba(255,180,30,0.6)")
  g.addColorStop(0.7, "rgba(255,100,0,0.2)")
  g.addColorStop(1,   "rgba(255,60,0,0)")
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, 32, 0, Math.PI * 2)
  ctx.fill()
  // Core
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fillStyle = "#FFF8CC"
  ctx.fill()
}

interface PlanetPos { id: string; x: number; y: number; r: number }

export function OrreryNav() {
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState<Planet | null>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const animRef    = useRef<number>()
  const startRef   = useRef(Date.now())
  const planetsPos = useRef<PlanetPos[]>([])
  const { setCurrentPlanet, currentPlanet } = useAstraStore()

  const stars = useMemo(() => Array.from({ length: 300 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.2 + 0.2,
    a: Math.random() * 0.6 + 0.2,
  })), [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext("2d")!
    const W    = canvas.width
    const H    = canvas.height
    const cx   = W / 2
    const cy   = H / 2
    const maxR = Math.min(W, H) * 0.44
    const elapsed = Date.now() - startRef.current

    ctx.clearRect(0, 0, W, H)

    // Stars
    stars.forEach(s => {
      ctx.beginPath()
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200,220,255,${s.a})`
      ctx.fill()
    })

    // Sun - drawn first, registered as clickable
    drawSun(ctx, cx, cy)
    const positions: PlanetPos[] = [{ id: "sun", x: cx, y: cy, r: 22 }]

    const now = new Date()

    // Only draw planets with orbits (skip sun - orbitalRadiusAU === 0)
    PLANETS.filter(p => p.orbitalRadiusAU > 0).forEach(p => {
      const base  = realAngle(p, now)
      const anim  = elapsed * ANIM_SCALE / p.orbitalPeriodDays * MERCURY_PERIOD
      const angle = base + anim
      const r     = displayR(p.orbitalRadiusAU, maxR)
      const x     = cx + r * Math.cos(angle)
      const y     = cy + r * Math.sin(angle)

      // Orbit ring
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(60,100,180,0.18)"
      ctx.lineWidth   = 0.8
      ctx.stroke()

      const dotR       = p.id === "jupiter" || p.id === "saturn" ? 6
                       : p.id === "neptune" || p.id === "uranus" ? 5 : 3.5
      const isSelected = selected?.id === p.id

      // Selection ring
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(x, y, dotR + 5, 0, Math.PI * 2)
        ctx.strokeStyle = `${p.color}70`
        ctx.lineWidth   = 1.5
        ctx.stroke()
      }

      // Planet dot
      ctx.beginPath()
      ctx.arc(x, y, dotR, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()

      // Saturn mini-rings
      if (p.id === "saturn") {
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(1, 0.35)
        ctx.beginPath()
        ctx.arc(0, 0, dotR + 8, 0, Math.PI * 2)
        ctx.strokeStyle = `${p.ringColor}90`
        ctx.lineWidth   = 3
        ctx.stroke()
        ctx.restore()
      }

      // Label
      ctx.font      = `500 10px 'JetBrains Mono', monospace`
      ctx.fillStyle = isSelected ? p.color : "rgba(180,210,255,0.50)"
      ctx.textAlign = "center"
      ctx.fillText(p.name.toUpperCase(), x, y + dotR + 14)

      positions.push({ id: p.id, x, y, r: dotR + 8 })
    })

    planetsPos.current = positions
  }, [stars, selected])

  useEffect(() => {
    if (!open) return
    const loop = () => { draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [open, draw])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    const mx     = (e.clientX - rect.left) * (canvas.width  / rect.width)
    const my     = (e.clientY - rect.top)  * (canvas.height / rect.height)

    for (const pos of planetsPos.current) {
      if (Math.hypot(mx - pos.x, my - pos.y) <= pos.r + 6) {
        setSelected(PLANET_MAP[pos.id] ?? null)
        return
      }
    }
    setSelected(null)
  }

  function navigateTo(planet: Planet) {
    setCurrentPlanet(planet.id)
    setOpen(false)
    setSelected(null)
  }

  function returnToEarth() {
    setCurrentPlanet(null)
    setOpen(false)
    setSelected(null)
  }

  // Format stat rows depending on whether it's the sun
  function statRows(p: Planet): [string, string][] {
    if (p.id === "sun") return [
      ["Diameter",  `${(p.diameterKm / 1000).toFixed(0)}k km`],
      ["Mass",      "1.989 × 10³⁰ kg"],
      ["Temp",      "~5,500°C surface"],
      ["Age",       "4.6 billion yr"],
    ]
    return [
      ["Diameter",  `${(p.diameterKm / 1000).toFixed(0)}k km`],
      ["Moons",     String(p.moons)],
      ["Orbit",     `${p.orbitalRadiusAU.toFixed(2)} AU`],
      ["Period",    p.orbitalPeriodDays < 365
        ? `${p.orbitalPeriodDays.toFixed(0)} days`
        : `${(p.orbitalPeriodDays / 365.25).toFixed(1)} yr`],
    ]
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-[56px] left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded mono text-[9px] tracking-widest uppercase transition-all"
        style={{
          background:     "rgba(4,10,20,0.85)",
          border:         "1px solid rgba(40,80,140,0.3)",
          color:          currentPlanet ? "#00E5A0" : "rgba(180,210,255,0.45)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ fontSize: 11 }}>◎</span>
        {currentPlanet ? (PLANET_MAP[currentPlanet]?.name ?? "Solar System") : "Solar System"}
      </button>

      {open && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(2,4,8,0.92)", backdropFilter: "blur(4px)" }}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 mono text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
          >
            ESC
          </button>

          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <div className="mono text-[10px] tracking-[0.3em] text-white/20 uppercase text-center">
              Inner Planets · Asteroid Belt · Gas Giants · Ice Giants
            </div>
          </div>

          <div className="relative" style={{ width: "min(90vw, 90vh)", height: "min(90vw, 90vh)" }}>
            <canvas
              ref={canvasRef}
              width={900}
              height={900}
              onClick={handleCanvasClick}
              className="cursor-crosshair"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {selected && (
            <div
              className="absolute right-6 top-1/2 -translate-y-1/2 w-64 rounded-xl p-4 space-y-3"
              style={{
                background:     "rgba(4,10,20,0.94)",
                border:         `1px solid ${selected.color}30`,
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selected.color }} />
                <span className="mono text-sm font-medium text-white/90">{selected.name}</span>
                <span className="mono text-[9px] text-white/25 ml-auto uppercase">{selected.type}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {statRows(selected).map(([label, val]) => (
                  <div key={label} className="rounded p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="mono text-[8px] text-white/25 uppercase tracking-widest mb-0.5">{label}</div>
                    <div className="mono text-[11px] text-white/70">{val}</div>
                  </div>
                ))}
              </div>

              <p className="mono text-[9px] text-white/35 leading-relaxed">{selected.fact}</p>

              {selected.missions.filter(m => m.active).length > 0 && (
                <div>
                  <div className="mono text-[8px] text-white/25 uppercase tracking-widest mb-1.5">
                    Active missions
                  </div>
                  <div className="space-y-1">
                    {selected.missions.filter(m => m.active).map(m => (
                      <div key={m.name} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#00E5A0]" />
                        <span className="mono text-[9px] text-white/50">{m.name}</span>
                        <span className="mono text-[8px] text-white/20 ml-auto uppercase">{m.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => navigateTo(selected)}
                  className="flex-1 py-2 rounded mono text-[9px] tracking-widest uppercase font-medium transition-all hover:opacity-90"
                  style={{ background: selected.color, color: "#020408" }}
                >
                  Navigate ↗
                </button>
                {currentPlanet && (
                  <button
                    onClick={returnToEarth}
                    className="px-3 py-2 rounded mono text-[9px] tracking-widest uppercase transition-all hover:bg-white/10"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                  >
                    Earth
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mono text-[9px] text-white/20 tracking-widest">
            Click to inspect · Navigate to visit
          </div>
        </div>
      )}
    </>
  )
}