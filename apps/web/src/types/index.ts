// SATELLITE
export interface TLE {
  name:  string
  line1: string
  line2: string
}

export interface SatelliteObject {
  id:          string
  name:        string
  noradId:     number
  type:        SatelliteType
  tle:         TLE
  position:    GeoPosition | null
  altitude_km: number
  velocity_kms: number
  footprint_km: number
}

export type SatelliteType =
  | "payload"
  | "rocket_body"
  | "debris"
  | "starlink"
  | "military"
  | "weather"
  | "nav"
  | "iss"

// FLIGHT
export interface Flight {
  icao24:      string
  callsign:    string
  origin:      string
  lat:         number
  lon:         number
  altitude_ft: number
  heading:     number
  speed_kts:   number
  is_military: boolean
  on_ground:   boolean
  last_seen:   number
}

// VESSEL
export interface Vessel {
  mmsi:      number
  name:      string
  callsign:  string
  type:      string
  lat:       number
  lon:       number
  heading:   number
  speed_kts: number
  status:    string
  dark:      boolean
  last_seen: number
}

// SEISMIC
export interface Earthquake {
  id:         string
  mag:        number
  place:      string
  lat:        number
  lon:        number
  depth_km:   number
  time:       number
  tsunami:    boolean
}

// FIRE
export interface Fire {
  lat:       number
  lon:       number
  brightness: number
  frp:        number
  acq_date:   string
  satellite:  string
}

// LAUNCH
export interface Launch {
  id:          string
  name:        string
  provider:    string
  vehicle:     string
  pad:         string
  lat:         number
  lon:         number
  net:         string
  status:      string
  description: string
}

// GEO
export interface GeoPosition {
  lat:      number
  lon:      number
  alt_km:   number
}

// ANOMALY
export interface Anomaly {
  id:          string
  type:        AnomalyType
  severity:    "low" | "medium" | "high" | "critical"
  title:       string
  description: string
  lat:         number
  lon:         number
  timestamp:   number
  layers:      string[]
}

export type AnomalyType =
  | "vessel_dark"
  | "unusual_flight_path"
  | "activity_cluster"
  | "launch_window"
  | "seismic_swarm"

// LAYER
export type LayerId =
  | "satellites"
  | "debris"
  | "flights"
  | "military_flights"
  | "vessels"
  | "earthquakes"
  | "fires"
  | "launches"
  | "anomalies"

export interface LayerState {
  id:      LayerId
  label:   string
  enabled: boolean
  count:   number
  color:   string
}

// SELECTION
export type SelectedObject =
  | { kind: "satellite"; data: SatelliteObject }
  | { kind: "flight";    data: Flight }
  | { kind: "vessel";    data: Vessel }
  | { kind: "quake";     data: Earthquake }
  | { kind: "fire";      data: Fire }
  | { kind: "launch";    data: Launch }
  | { kind: "anomaly";   data: Anomaly }
  | null

// VIEW
export type ViewMode = "orbital" | "globe" | "surveillance" | "intelligence"

export interface CameraState {
  lat:    number
  lon:    number
  alt_km: number
  mode:   ViewMode
}
