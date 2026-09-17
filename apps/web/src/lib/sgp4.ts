import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from "satellite.js"
import type { TLE, GeoPosition } from "@/types"

export interface SatRecord {
  satrec: ReturnType<typeof twoline2satrec>
}

export function parseTLE(tle: TLE): SatRecord | null {
  try {
    const satrec = twoline2satrec(tle.line1, tle.line2)
    return { satrec }
  } catch {
    return null
  }
}

export function propagateNow(rec: SatRecord): GeoPosition | null {
  try {
    const now    = new Date()
    const result = propagate(rec.satrec, now)
    if (typeof result.position === "boolean" || !result.position) return null

    const gmst = gstime(now)
    const geo  = eciToGeodetic(result.position as any, gmst)

    return {
      lat:    degreesLat(geo.latitude),
      lon:    degreesLong(geo.longitude),
      alt_km: geo.height,
    }
  } catch {
    return null
  }
}

export function velocityKms(rec: SatRecord): number {
  try {
    const result = propagate(rec.satrec, new Date())
    if (typeof result.velocity === "boolean" || !result.velocity) return 0
    const v = result.velocity as { x: number; y: number; z: number }
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)
  } catch {
    return 0
  }
}
