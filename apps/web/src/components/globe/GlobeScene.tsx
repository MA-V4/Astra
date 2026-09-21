"use client"

import { Suspense }      from "react"
import { Canvas }        from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import { Earth }          from "./Earth"
import { Atmosphere }     from "./Atmosphere"
import { Terminator }     from "./Terminator"
import { ISSRing }        from "./ISSRing"
import { SatLayer }       from "./layers/SatLayer"
import { FlightLayer }    from "./layers/FlightLayer"
import { FootprintLayer } from "./layers/FootprintLayer"
import { DebrisShell }    from "./layers/DebrisShell"
import { QuakeLayer }     from "./layers/QuakeLayer"
import { LaunchLayer }    from "./layers/LaunchLayer"
import { VesselLayer }    from "./layers/VesselLayer"
import { AnomalyLayer }   from "./layers/AnomalyLayer"
import { PlanetScene }    from "./PlanetScene"
import { useDataFeed }    from "@/hooks/useDataFeed"
import { useAstraStore }  from "@/store"
import { PLANET_MAP }     from "@/lib/planets"

// HTML overlay shown when viewing a planet - lives OUTSIDE Canvas
function PlanetOverlay({ planetId }: { planetId: string }) {
  const planet             = PLANET_MAP[planetId]
  const { setCurrentPlanet } = useAstraStore()
  const active             = planet?.missions.filter(m => m.active) ?? []

  return (
    <>
      {/* Return button */}
      <button
        onClick={() => setCurrentPlanet(null)}
        className="absolute top-12 left-3 mt-2 flex items-center gap-2 px-3 py-1.5 rounded z-30 mono text-[9px] tracking-widest uppercase transition-all hover:opacity-80"
        style={{
          background:     "rgba(4,10,20,0.88)",
          border:         "1px solid rgba(0,229,160,0.25)",
          color:          "rgba(0,229,160,0.75)",
          backdropFilter: "blur(12px)",
        }}
      >
        ← Earth
      </button>

      {/* Planet info panel */}
      {planet && (
        <div
          className="absolute top-12 right-3 mt-2 w-60 rounded-xl p-4 space-y-3 z-30"
          style={{
            background:     "rgba(4,10,20,0.90)",
            border:         `1px solid ${planet.color}28`,
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: planet.color }} />
            <span className="mono text-sm font-medium text-white/85">{planet.name}</span>
            <span className="mono text-[9px] text-white/25 ml-auto uppercase">{planet.type}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {([
              ["Diameter",  `${(planet.diameterKm / 1000).toFixed(0)}k km`],
              ["Moons",     String(planet.moons)],
              ["Orbit",     `${planet.orbitalRadiusAU.toFixed(2)} AU`],
              ["Period",    planet.orbitalPeriodDays < 365
                ? `${planet.orbitalPeriodDays.toFixed(0)} days`
                : `${(planet.orbitalPeriodDays / 365.25).toFixed(1)} yr`],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} className="rounded p-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="mono text-[8px] text-white/25 uppercase tracking-widest">{l}</div>
                <div className="mono text-[10px] text-white/65 mt-0.5">{v}</div>
              </div>
            ))}
          </div>

          <p className="mono text-[9px] text-white/30 leading-relaxed">{planet.fact}</p>

          {active.length > 0 && (
            <div>
              <div className="mono text-[8px] text-white/20 uppercase tracking-widest mb-1.5">
                Active missions
              </div>
              {active.map(m => (
                <div key={m.name} className="flex items-center gap-1.5 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-[#00E5A0]" />
                  <span className="mono text-[9px] text-white/45">{m.name}</span>
                  <span className="mono text-[8px] text-white/20 ml-auto capitalize">{m.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function EarthScene() {
  return (
    <>
      <Stars radius={300} depth={60} count={10000} factor={4} saturation={0} fade />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} color="#FFF8F0" />
      <Suspense fallback={null}>
        <Earth />
        <Atmosphere />
        <Terminator />
      </Suspense>
      <ISSRing />
      <SatLayer />
      <FlightLayer />
      <DebrisShell />
      <QuakeLayer />
      <LaunchLayer />
      <VesselLayer />
      <FootprintLayer />
      <AnomalyLayer />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={1.2}
        maxDistance={50}
        zoomSpeed={0.6}
        rotateSpeed={0.4}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}

function Scene() {
  const { currentPlanet } = useAstraStore()
  useDataFeed()

  if (currentPlanet) {
    return <PlanetScene planetId={currentPlanet} />
  }

  return <EarthScene />
}

export function GlobeScene() {
  const { currentPlanet } = useAstraStore()

  return (
    <div className="absolute inset-0">
      {/* HTML overlays - outside Canvas so R3F never touches them */}
      {currentPlanet && <PlanetOverlay planetId={currentPlanet} />}

      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 3.5], fov: 45, near: 0.05, far: 2000 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ background: "#020508" }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}