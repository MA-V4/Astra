"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useAstraStore } from "@/store"
import { geoToXYZ }    from "@/lib/geo"

export function FlightLayer() {
  const { flights, layers } = useAstraStore()
  const enabled    = layers.find(l => l.id === "flights")?.enabled ?? true
  const militaryOn = layers.find(l => l.id === "military_flights")?.enabled ?? false

  const geometry = useMemo(() => {
    const visible = flights.filter(f => !f.on_ground && (!f.is_military || militaryOn))
    const positions = new Float32Array(visible.length * 3)
    const colors    = new Float32Array(visible.length * 3)

    visible.forEach((f, i) => {
      const alt_km = f.altitude_ft * 0.0003048
      const radius = 1 + alt_km / 6371
      const pos = geoToXYZ(f.lat, f.lon, radius)
      positions[i * 3]     = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      if (f.is_military) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.72; colors[i * 3 + 2] = 0.30
      } else {
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.70
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3))
    return geo
  }, [flights, militaryOn])

  if (!enabled || flights.length === 0) return null

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.003}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
