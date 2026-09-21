"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useAstraStore } from "@/store"
import { geoToXYZ } from "@/lib/geo"

export function LaunchLayer() {
  const { launches, layers } = useAstraStore()
  const enabled = layers.find(l => l.id === "launches")?.enabled ?? false

  const valid = launches.filter(l => l.lat !== 0 && l.lon !== 0)

  const geometry = useMemo(() => {
    const positions = new Float32Array(valid.length * 3)
    const colors    = new Float32Array(valid.length * 3)

    valid.forEach((l, i) => {
      const pos = geoToXYZ(l.lat, l.lon, 1.005)
      positions[i * 3]     = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      // Go = green, TBC = orange, else blue
      const status = (l.status ?? "").toLowerCase()
      if (status === "go") {
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.7
      } else if (status.includes("tbc") || status.includes("tbd")) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.0
      } else {
        colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 1.0
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3))
    return geo
  }, [valid])

  if (!enabled || valid.length === 0) return null

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.014}
        sizeAttenuation
        vertexColors
        transparent
        opacity={1.0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}