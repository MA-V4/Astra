"use client"

import { Suspense } from "react"
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
import { useDataFeed }    from "@/hooks/useDataFeed"
import { AnomalyLayer } from "./layers/AnomalyLayer"

function Scene() {
  useDataFeed()

  return (
    <>
      {/* Star field */}
      <Stars radius={300} depth={60} count={10000} factor={4} saturation={0} fade />

      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#FFF5E0" />

      {/* Earth stack */}
      <Suspense fallback={null}>
        <Earth />
        <Atmosphere />
        <Terminator />
      </Suspense>

      {/* Orbital elements */}
      <ISSRing />

      {/* Data layers */}
      <SatLayer />
      <FlightLayer />
      <DebrisShell />
      <FootprintLayer />
      <AnomalyLayer />

      {/* Camera */}
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

export function GlobeScene() {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0, 3.5], fov: 45, near: 0.05, far: 2000 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ background: "#020508" }}
    >
      <Scene />
    </Canvas>
  )
}
