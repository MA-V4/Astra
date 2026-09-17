"use client"

import { useMemo, useCallback } from "react"
import * as THREE from "three"
import { useThree } from "@react-three/fiber"
import { useAstraStore } from "@/store"
import { geoToXYZ } from "@/lib/geo"
import type { SatelliteObject, SatelliteType } from "@/types"

const TYPE_COLORS: Record<SatelliteType, [number, number, number]> = {
  payload:     [0.30, 0.65, 1.00],  // stellar blue
  starlink:    [0.20, 0.80, 0.60],  // teal
  debris:      [1.00, 0.42, 0.21],  // orange
  military:    [1.00, 0.72, 0.30],  // gold
  iss:         [0.00, 1.00, 0.70],  // bright aurora
  rocket_body: [0.55, 0.55, 0.65],  // grey
  weather:     [0.60, 0.90, 1.00],  // light blue
  nav:         [0.90, 0.90, 0.35],  // yellow
}

const TYPE_SIZES: Record<SatelliteType, number> = {
  iss:         0.010,
  military:    0.006,
  weather:     0.005,
  nav:         0.005,
  starlink:    0.004,
  payload:     0.004,
  rocket_body: 0.003,
  debris:      0.002,
}

export function SatLayer() {
  const { satellites, layers, setSelected } = useAstraStore()
  const { camera, raycaster, gl } = useThree()

  const debrisOn   = layers.find(l => l.id === "debris")?.enabled ?? false
  const milOn      = layers.find(l => l.id === "military_flights")?.enabled ?? true
  const satEnabled = layers.find(l => l.id === "satellites")?.enabled ?? true

  const visible = useMemo(() =>
    satellites.filter(s =>
      s.position &&
      (s.type !== "debris" || debrisOn) &&
      (s.type !== "military" || milOn)
    ),
    [satellites, debrisOn, milOn],
  )

  const { geometry, satIndex } = useMemo(() => {
    const positions = new Float32Array(visible.length * 3)
    const colors    = new Float32Array(visible.length * 3)
    const sizes     = new Float32Array(visible.length)
    const index: SatelliteObject[] = []

    visible.forEach((sat, i) => {
      if (!sat.position) return
      const radius = 1 + sat.altitude_km / 6371
      const pos    = geoToXYZ(sat.position.lat, sat.position.lon, radius)
      positions[i * 3]     = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      const col = TYPE_COLORS[sat.type] ?? [0.8, 0.8, 0.8]
      colors[i * 3]     = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]

      sizes[i] = TYPE_SIZES[sat.type] ?? 0.004
      index.push(sat)
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3))
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1))
    return { geometry: geo, satIndex: index }
  }, [visible])

  if (!satEnabled || visible.length === 0) return null

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
