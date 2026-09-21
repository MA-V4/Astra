"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useAstraStore } from "@/store"
import { geoToXYZ } from "@/lib/geo"

export function VesselLayer() {
  const { vessels, layers } = useAstraStore()
  const enabled = layers.find(l => l.id === "vessels")?.enabled ?? false

  const geometry = useMemo(() => {
    const positions = new Float32Array(vessels.length * 3)
    const colors    = new Float32Array(vessels.length * 3)

    vessels.forEach((v, i) => {
      const pos = geoToXYZ(v.lat, v.lon, 1.002)
      positions[i * 3]     = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      if (v.dark) {
        // Dark vessel - red
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.2
      } else {
        // Normal vessel - stellar blue
        colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.65; colors[i * 3 + 2] = 1.0
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3))
    return geo
  }, [vessels])

  if (!enabled || vessels.length === 0) return null

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.004}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}