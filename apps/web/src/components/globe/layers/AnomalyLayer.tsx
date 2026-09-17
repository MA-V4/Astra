"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useAstraStore } from "@/store"
import { geoToXYZ }      from "@/lib/geo"
import type { Anomaly }  from "@/types"

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  critical: [1.00, 0.10, 0.20],
  high:     [1.00, 0.30, 0.10],
  medium:   [1.00, 0.72, 0.10],
  low:      [0.60, 0.80, 1.00],
}

const SEVERITY_SIZES: Record<string, number> = {
  critical: 0.016,
  high:     0.012,
  medium:   0.009,
  low:      0.006,
}

export function AnomalyLayer() {
  const { anomalies, layers, setSelected } = useAstraStore()
  const enabled = layers.find(l => l.id === "anomalies")?.enabled ?? true

  const { geometry } = useMemo(() => {
    const positions = new Float32Array(anomalies.length * 3)
    const colors    = new Float32Array(anomalies.length * 3)

    anomalies.forEach((a, i) => {
      const pos = geoToXYZ(a.lat, a.lon, 1.008)
      positions[i * 3]     = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      const col = SEVERITY_COLORS[a.severity] ?? [1, 1, 1]
      colors[i * 3]     = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3))
    return { geometry: geo }
  }, [anomalies])

  if (!enabled || anomalies.length === 0) return null

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.012}
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