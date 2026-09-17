"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useAstraStore } from "@/store"
import { geoToXYZ } from "@/lib/geo"

const DEG = Math.PI / 180

// Build the footprint circle on Earth's surface for a satellite at (lat, lon, alt_km).
// The footprint is the set of points on Earth's surface visible from the satellite.
function buildFootprintRing(lat: number, lon: number, footprint_km: number, segments = 128) {
  const R = 6371
  // Angular radius of footprint in radians
  const angRad = footprint_km / R

  // Build a circle on a unit sphere centred at the sub-satellite point,
  // then rotate to the correct latitude/longitude.
  const positions = new Float32Array((segments + 1) * 3)
  const phi   = (90 - lat)  * DEG
  const theta = (lon + 180) * DEG

  // Rotation: first rotate by phi around Z, then by theta around Y
  const rotY  = new THREE.Matrix4().makeRotationY(theta)
  const rotZ  = new THREE.Matrix4().makeRotationZ(phi)
  const rotMat = new THREE.Matrix4().multiplyMatrices(rotY, rotZ)

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    // Point on unit sphere around the north pole at angular radius
    const x = Math.sin(angRad) * Math.cos(angle)
    const y = Math.cos(angRad)
    const z = Math.sin(angRad) * Math.sin(angle)
    const v = new THREE.Vector3(x, y, z).applyMatrix4(rotMat)
    // Put on Earth's surface (radius = 1.002 to avoid z-fighting)
    positions[i * 3]     = v.x * 1.002
    positions[i * 3 + 1] = v.y * 1.002
    positions[i * 3 + 2] = v.z * 1.002
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  return geo
}

// Build a cone from the satellite position to its footprint ring on Earth.
function buildCone(
  satLat: number,
  satLon: number,
  satAlt: number,
  footprint_km: number,
  segments = 64,
): THREE.BufferGeometry {
  const R     = 6371
  const angRad = footprint_km / R
  const satR   = 1 + satAlt / R
  const satPos  = geoToXYZ(satLat, satLon, satR)

  const phi   = (90 - satLat) * DEG
  const theta = (satLon + 180) * DEG
  const rotY  = new THREE.Matrix4().makeRotationY(theta)
  const rotZ  = new THREE.Matrix4().makeRotationZ(phi)
  const rotMat = new THREE.Matrix4().multiplyMatrices(rotY, rotZ)

  const verts: number[] = []
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.sin(angRad) * Math.cos(angle)
    const y = Math.cos(angRad)
    const z = Math.sin(angRad) * Math.sin(angle)
    const ring = new THREE.Vector3(x, y, z).applyMatrix4(rotMat).multiplyScalar(1.002)

    // Line from satellite to ring point
    verts.push(satPos.x, satPos.y, satPos.z)
    verts.push(ring.x,   ring.y,   ring.z)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3))
  return geo
}

export function FootprintLayer() {
  const { selected } = useAstraStore()

  const sat = selected?.kind === "satellite" ? selected.data : null
  if (!sat || !sat.position) return null

  const { lat, lon } = sat.position
  const { altitude_km, footprint_km } = sat

  const ringGeo = useMemo(
    () => buildFootprintRing(lat, lon, footprint_km),
    [lat, lon, footprint_km],
  )

  const coneGeo = useMemo(
    () => buildCone(lat, lon, altitude_km, footprint_km),
    [lat, lon, altitude_km, footprint_km],
  )

  return (
    <group>
      {/* Footprint ring on Earth's surface */}
      <line geometry={ringGeo}>
        <lineBasicMaterial
          color={0x4DA6FF}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </line>

      {/* Cone lines from satellite to footprint */}
      <lineSegments geometry={coneGeo}>
        <lineBasicMaterial
          color={0x4DA6FF}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Filled footprint disc (semi-transparent) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[footprint_km / 6371, 64]} />
        <meshBasicMaterial
          color={0x4DA6FF}
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
