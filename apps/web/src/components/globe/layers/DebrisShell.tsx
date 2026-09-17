"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useAstraStore } from "@/store"
import { geoToXYZ } from "@/lib/geo"

export function DebrisShell() {
  const { satellites, layers } = useAstraStore()
  const enabled = layers.find(l => l.id === "debris")?.enabled ?? false

  const debris = satellites.filter(s => s.type === "debris" || s.type === "rocket_body")

  const geometry = useMemo(() => {
    if (!enabled || debris.length === 0) return null

    const positions = new Float32Array(debris.length * 3)
    const colors    = new Float32Array(debris.length * 3)

    debris.forEach((d, i) => {
      if (!d.position) return
      const r   = 1 + d.altitude_km / 6371
      const pos = geoToXYZ(d.position.lat, d.position.lon, r)
      positions[i * 3]     = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      // Color by altitude: LEO = orange, MEO = red, GEO = yellow
      if (d.altitude_km < 2000) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.42; colors[i * 3 + 2] = 0.21
      } else if (d.altitude_km < 20000) {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.20; colors[i * 3 + 2] = 0.30
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.80; colors[i * 3 + 2] = 0.10
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3))
    return geo
  }, [enabled, debris])

  if (!enabled || !geometry) return null

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.002}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
