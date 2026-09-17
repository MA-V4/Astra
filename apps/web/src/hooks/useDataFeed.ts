"use client"

import { useEffect } from "react"
import { useAstraStore } from "@/store"
import { api }           from "@/lib/api"
import { parseTLE, propagateNow, velocityKms } from "@/lib/sgp4"
import { footprintRadius } from "@/lib/geo"
import type { SatelliteObject, Flight, SatelliteType } from "@/types"

const POLL_SATELLITES_MS  = 60_000 * 5   // TLEs change slowly
const POLL_FLIGHTS_MS     = 15_000
const POLL_EARTHQUAKES_MS = 60_000
const POLL_FIRES_MS       = 60_000 * 10
const POLL_LAUNCHES_MS    = 60_000 * 5
const PROPAGATE_MS        = 2_000        // Re-propagate satellite positions

function classifySat(name: string): SatelliteType {
  const n = name.toUpperCase()
  if (n.includes("STARLINK"))  return "starlink"
  if (n.includes("ISS"))       return "iss"
  if (n.includes("DEB") || n.includes("R/B")) return "debris"
  if (n.includes("COSMOS") || n.includes("USA") || n.includes("NROL")) return "military"
  if (n.includes("NOAA") || n.includes("METOP") || n.includes("GOES")) return "weather"
  if (n.includes("GPS") || n.includes("GLONASS") || n.includes("GALILEO")) return "nav"
  if (n.includes("ROCKET")) return "rocket_body"
  return "payload"
}

export function useDataFeed() {
  const {
    layers, setSatellites, setFlights,
    setEarthquakes, setFires, setLaunches, touch,
  } = useAstraStore()

  const isOn = (id: string) => layers.find(l => l.id === id)?.enabled ?? false

  // SATELLITES — fetch TLEs then propagate locally
  useEffect(() => {
    let records: Array<{ obj: SatelliteObject; rec: ReturnType<typeof parseTLE> }> = []

    async function fetchTLEs() {
      try {
        const raw: any[] = await api.satellites()
        records = raw.map((r: any) => {
          const type = classifySat(r.name)
          const tle  = { name: r.name, line1: r.line1, line2: r.line2 }
          const rec  = parseTLE(tle)
          const pos  = rec ? propagateNow(rec) : null
          const vel  = rec ? velocityKms(rec) : 0
          const alt  = pos?.alt_km ?? 0

          return {
            rec,
            obj: {
              id:            String(r.norad_id ?? r.id),
              name:          r.name,
              noradId:       r.norad_id ?? 0,
              type,
              tle,
              position:      pos,
              altitude_km:   alt,
              velocity_kms:  vel,
              footprint_km:  footprintRadius(alt),
            } satisfies SatelliteObject,
          }
        })
        setSatellites(records.map(r => r.obj))
      } catch (e) {
        console.warn("satellite fetch failed:", e)
      }
    }

    function propagate() {
      if (records.length === 0) return
      const updated = records.map(({ rec, obj }) => {
        if (!rec) return obj
        const pos = propagateNow(rec)
        return { ...obj, position: pos, altitude_km: pos?.alt_km ?? obj.altitude_km }
      })
      setSatellites(updated)
      touch()
    }

    fetchTLEs()
    const fetchId    = setInterval(fetchTLEs,  POLL_SATELLITES_MS)
    const propagateId = setInterval(propagate, PROPAGATE_MS)
    return () => { clearInterval(fetchId); clearInterval(propagateId) }
  }, [])

  // FLIGHTS
  useEffect(() => {
    if (!isOn("flights") && !isOn("military_flights")) return

    async function fetchFlights() {
      try {
        const raw: any[] = await api.flights()
        const flights: Flight[] = raw.map((f: any) => ({
          icao24:      f.icao24 ?? "",
          callsign:    f.callsign?.trim() ?? "",
          origin:      f.origin_country ?? "",
          lat:         f.latitude  ?? 0,
          lon:         f.longitude ?? 0,
          altitude_ft: (f.baro_altitude ?? f.geo_altitude ?? 0) * 3.28084,
          heading:     f.true_track ?? 0,
          speed_kts:   (f.velocity ?? 0) * 1.944,
          is_military: false,
          on_ground:   f.on_ground ?? false,
          last_seen:   f.time_position ?? Date.now() / 1000,
        }))
        setFlights(flights)
        touch()
      } catch (e) {
        console.warn("flight fetch failed:", e)
      }
    }

    fetchFlights()
    const id = setInterval(fetchFlights, POLL_FLIGHTS_MS)
    return () => clearInterval(id)
  }, [layers])

  // EARTHQUAKES
  useEffect(() => {
    if (!isOn("earthquakes")) return
    const fetchQ = async () => {
      try { setEarthquakes(await api.earthquakes()); touch() }
      catch (e) { console.warn("earthquake fetch failed:", e) }
    }
    fetchQ()
    const id = setInterval(fetchQ, POLL_EARTHQUAKES_MS)
    return () => clearInterval(id)
  }, [layers])

  // FIRES
  useEffect(() => {
    if (!isOn("fires")) return
    const fetchF = async () => {
      try { setFires(await api.fires()); touch() }
      catch (e) { console.warn("fire fetch failed:", e) }
    }
    fetchF()
    const id = setInterval(fetchF, POLL_FIRES_MS)
    return () => clearInterval(id)
  }, [layers])

  // LAUNCHES
  useEffect(() => {
    const fetchL = async () => {
      try { setLaunches(await api.launches()); touch() }
      catch (e) { console.warn("launch fetch failed:", e) }
    }
    fetchL()
    const id = setInterval(fetchL, POLL_LAUNCHES_MS)
    return () => clearInterval(id)
  }, [])

  // ANOMALIES — poll every 30 seconds
useEffect(() => {
  const fetchA = async () => {
    try { useAstraStore.getState().setAnomalies(await api.anomalies()); touch() }
    catch (e) { console.warn("anomaly fetch failed:", e) }
  }
  fetchA()
  const id = setInterval(fetchA, 30_000)
  return () => clearInterval(id)
}, [layers])
}
