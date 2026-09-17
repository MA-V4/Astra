import * as THREE from "three"

const DEG = Math.PI / 180

/**
 * Convert geographic coordinates to Three.js XYZ on a sphere.
 * radius=1 is Earth's surface. Satellites are at radius = 1 + alt_km/6371.
 */
export function geoToXYZ(lat: number, lon: number, radius = 1): THREE.Vector3 {
  const phi   = (90 - lat)  * DEG
  const theta = (lon + 180) * DEG

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  )
}

/**
 * Great-circle distance in km between two points.
 */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R  = 6371
  const dL = (lat2 - lat1) * DEG
  const dN = (lon2 - lon1) * DEG
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dN / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Satellite footprint radius in km at a given altitude.
 * Uses the simplified spherical Earth model.
 */
export function footprintRadius(altitude_km: number): number {
  const R   = 6371
  const eta = Math.acos(R / (R + altitude_km))
  return R * eta
}
