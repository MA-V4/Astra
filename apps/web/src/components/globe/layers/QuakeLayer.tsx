"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useAstraStore } from "@/store"
import { geoToXYZ } from "@/lib/geo"

export function QuakeLayer() {
  const { earthquakes, layers } = useAstraStore()
  const enabled = layers.find(l => l.id === "earthquakes")?.enabled ?? false

  const geometry = useMemo(() => {
    const positions = new Float32Array(earthquakes.length * 3)
    const colors    = new Float32Array(earthquakes.length * 3)

    earthquakes.forEach((q, i) => {
      const pos = geoToXYZ(q.lat, q.lon, 1.004)
      positions[i * 3]     = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      // Color by magnitude
      const t = Math.min((q.mag - 2.5) / 5.5, 1.0)
      colors[i * 3]     = t
      colors[i * 3 + 1] = 1.0 - t
      colors[i * 3 + 2] = 0.2
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3))
    return geo
  }, [earthquakes])

  if (!enabled || earthquakes.length === 0) return null

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.012}
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