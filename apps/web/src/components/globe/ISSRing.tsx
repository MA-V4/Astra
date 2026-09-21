"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useAstraStore } from "@/store"

// ISS orbital altitude ~400 km
const ISS_RADIUS = 1 + 400 / 6371

// Orbital inclination of the ISS: ~51.6°
const INCLINATION = 51.6 * (Math.PI / 180)

function buildOrbitRing(radius: number, inclination: number, segments = 256): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * 3)
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    // Tilted circle
    positions[i * 3]     = radius * Math.cos(t)
    positions[i * 3 + 1] = radius * Math.sin(t) * Math.sin(inclination)
    positions[i * 3 + 2] = radius * Math.sin(t) * Math.cos(inclination)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  return geo
}

export function ISSRing() {
  const { satellites, layers } = useAstraStore()
  const satEnabled = layers.find(l => l.id === "satellites")?.enabled ?? true

  const iss = satellites.find(s => s.type === "iss")
  if (!satEnabled || !iss) return null

  const geometry = useMemo(() => buildOrbitRing(ISS_RADIUS, INCLINATION), [])

  const orbitLine = useMemo(() => {
  const mat = new THREE.LineBasicMaterial({
    color: 0x00FFB2, transparent: true, opacity: 0.2,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  return new THREE.Line(geometry, mat)
}, [geometry])

return (
  <group>
    <primitive object={orbitLine} />

      {/* Glow ring at current ISS position */}
      {iss.position && (() => {
        const r    = 1 + iss.altitude_km / 6371
        const phi  = (90 - iss.position.lat)  * (Math.PI / 180)
        const theta = (iss.position.lon + 180) * (Math.PI / 180)
        const x = -r * Math.sin(phi) * Math.cos(theta)
        const y =  r * Math.cos(phi)
        const z =  r * Math.sin(phi) * Math.sin(theta)

        return (
          <mesh position={[x, y, z]}>
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial
              color={0x00FFB2}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )
      })()}
    </group>
  )
}
