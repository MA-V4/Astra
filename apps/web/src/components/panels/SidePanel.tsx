"use client"

import { useAstraStore } from "@/store"
import type { SelectedObject, SatelliteObject, Flight } from "@/types"

const TYPE_LABELS: Record<string, string> = {
  payload:     "Payload",
  starlink:    "Starlink",
  debris:      "Debris",
  military:    "Military",
  iss:         "Space Station",
  rocket_body: "Rocket Body",
  weather:     "Weather Sat",
  nav:         "Navigation",
}

const TYPE_COLORS: Record<string, string> = {
  payload:     "#4DA6FF",
  starlink:    "#00CC8E",
  debris:      "#FF6B35",
  military:    "#FFB84D",
  iss:         "#00FFB2",
  rocket_body: "#9999AA",
  weather:     "#99E5FF",
  nav:         "#E5E566",
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest shrink-0">{label}</span>
      <span className={`text-xs font-mono text-right ${color ? "" : "text-white/75"}`} style={color ? { color } : {}}>
        {value}
      </span>
    </div>
  )
}

function SatelliteDetail({ data }: { data: SatelliteObject }) {
  const color = TYPE_COLORS[data.type] ?? "#4DA6FF"
  return (
    <div className="space-y-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color }}>
            {TYPE_LABELS[data.type] ?? data.type}
          </span>
        </div>
        <div className="text-base font-mono font-semibold text-white leading-tight">{data.name}</div>
        <div className="text-xs font-mono text-white/30 mt-0.5">NORAD #{data.noradId}</div>
      </div>

      <Row label="Altitude"      value={`${data.altitude_km.toFixed(0)} km`} />
      <Row label="Velocity"      value={`${data.velocity_kms.toFixed(2)} km/s`} />
      <Row label="Footprint"     value={`${data.footprint_km.toFixed(0)} km radius`} />
      {data.position && <>
        <Row label="Latitude"    value={`${data.position.lat.toFixed(4)}°`} />
        <Row label="Longitude"   value={`${data.position.lon.toFixed(4)}°`} />
      </>}
      <Row label="Orbital class" value={data.altitude_km < 2000 ? "LEO" : data.altitude_km < 35000 ? "MEO" : "GEO"} />
    </div>
  )
}

function FlightDetail({ data }: { data: Flight }) {
  return (
    <div className="space-y-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: data.is_military ? "#FFB84D" : "#00FFB2" }} />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: data.is_military ? "#FFB84D" : "#00FFB2" }}>
            {data.is_military ? "Military Flight" : "Commercial Flight"}
          </span>
        </div>
        <div className="text-base font-mono font-semibold text-white">{data.callsign || data.icao24}</div>
        <div className="text-xs font-mono text-white/30 mt-0.5">{data.origin}</div>
      </div>
      <Row label="Altitude"  value={`${(data.altitude_ft / 1000).toFixed(1)}k ft`} />
      <Row label="Speed"     value={`${data.speed_kts.toFixed(0)} kts`} />
      <Row label="Heading"   value={`${data.heading.toFixed(0)}°`} />
      <Row label="Status"    value={data.on_ground ? "On Ground" : "Airborne"} />
      <Row label="Position"  value={`${data.lat.toFixed(4)}°, ${data.lon.toFixed(4)}°`} />
    </div>
  )
}

export function SidePanel() {
  const { selected, sidePanelOpen, setSelected } = useAstraStore()

  if (!sidePanelOpen || !selected) return null

  return (
    <div className="absolute top-14 right-4 bottom-16 w-72 glass rounded-xl overflow-hidden z-10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-stellar animate-pulse" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            Object Detail
          </span>
        </div>
        <button
          onClick={() => setSelected(null)}
          className="text-white/25 hover:text-white/60 text-xs font-mono transition-colors"
        >
          ESC
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {selected.kind === "satellite" && <SatelliteDetail data={selected.data} />}
        {selected.kind === "flight"    && <FlightDetail    data={selected.data} />}
      </div>

      {selected.kind === "satellite" && (
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-[10px] font-mono text-stellar/50 leading-relaxed">
            Footprint cone active. Blue ring shows area currently visible from this satellite.
          </p>
        </div>
      )}
    </div>
  )
}
