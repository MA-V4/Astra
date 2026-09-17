"use client"

import { useMemo, useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// Approximates the sun direction vector in world space based on UTC time.
function sunDirection(): THREE.Vector3 {
  const now   = new Date()
  const hours = now.getUTCHours() + now.getUTCMinutes() / 60
  const doy   = Math.floor((now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000)
  const sunLon = -(hours * 15) * (Math.PI / 180)
  const sunLat = 23.5 * Math.sin((doy / 365) * 2 * Math.PI - Math.PI / 2) * (Math.PI / 180)
  return new THREE.Vector3(
    Math.cos(sunLat) * Math.cos(sunLon),
    Math.sin(sunLat),
    Math.cos(sunLat) * Math.sin(sunLon),
  ).normalize()
}

// Build a ring of points along the great circle perpendicular to the sun direction.
// This is the day/night terminator line.
function buildTerminator(sun: THREE.Vector3, radius = 1.002, segments = 256): THREE.BufferGeometry {
  // Perpendicular basis vectors
  const up   = Math.abs(sun.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const u    = new THREE.Vector3().crossVectors(sun, up).normalize()
  const v    = new THREE.Vector3().crossVectors(sun, u).normalize()

  const positions = new Float32Array((segments + 1) * 3)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = u.x * Math.cos(angle) + v.x * Math.sin(angle)
    const y = u.y * Math.cos(angle) + v.y * Math.sin(angle)
    const z = u.z * Math.cos(angle) + v.z * Math.sin(angle)
    positions[i * 3]     = x * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = z * radius
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  return geo
}

export function Terminator() {
  const lineRef = useRef<THREE.Line>(null!)
  const sunRef  = useRef(sunDirection())

  useEffect(() => {
    const id = setInterval(() => { sunRef.current = sunDirection() }, 60_000)
    return () => clearInterval(id)
  }, [])

  useFrame(() => {
    if (!lineRef.current) return
    const geo = buildTerminator(sunRef.current)
    lineRef.current.geometry.dispose()
    lineRef.current.geometry = geo
  })

  const initialGeo = useMemo(() => buildTerminator(sunRef.current), [])

  return (
    <line ref={lineRef} geometry={initialGeo}>
      <lineBasicMaterial
        color={0xFFEFAA}
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </line>
  )
}
