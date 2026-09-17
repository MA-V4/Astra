import { create } from "zustand"
import type {
  LayerState, LayerId, SelectedObject, CameraState, ViewMode,
  SatelliteObject, Flight, Vessel, Earthquake, Fire, Launch, Anomaly,
} from "@/types"

interface AstraState {
  // DATA
  satellites:  SatelliteObject[]
  flights:     Flight[]
  vessels:     Vessel[]
  earthquakes: Earthquake[]
  fires:       Fire[]
  launches:    Launch[]
  anomalies:   Anomaly[]

  // LAYERS
  layers: LayerState[]

  // SELECTION
  selected:    SelectedObject
  highlighted: string | null

  // CAMERA
  camera: CameraState

  // UI
  sidePanelOpen:    boolean
  briefingOpen:     boolean
  lastUpdate:       number

  // ACTIONS
  setSatellites:  (s: SatelliteObject[]) => void
  setFlights:     (f: Flight[])          => void
  setVessels:     (v: Vessel[])          => void
  setEarthquakes: (e: Earthquake[])      => void
  setFires:       (f: Fire[])            => void
  setLaunches:    (l: Launch[])          => void
  setAnomalies:   (a: Anomaly[])         => void

  toggleLayer:  (id: LayerId) => void
  setSelected:  (obj: SelectedObject) => void
  setHighlight: (id: string | null)   => void
  setCamera:    (c: Partial<CameraState>) => void
  setViewMode:  (mode: ViewMode)          => void
  toggleSidePanel:  () => void
  toggleBriefing:   () => void
  touch: () => void
}

const DEFAULT_LAYERS: LayerState[] = [
  { id: "satellites",       label: "Satellites",        enabled: true,  count: 0, color: "#4DA6FF" },
  { id: "debris",           label: "Debris Field",      enabled: false, count: 0, color: "#FF6B35" },
  { id: "flights",          label: "Live Flights",      enabled: true,  count: 0, color: "#00FFB2" },
  { id: "military_flights", label: "Military",          enabled: false, count: 0, color: "#FFB84D" },
  { id: "vessels",          label: "Vessels",           enabled: false, count: 0, color: "#4DA6FF" },
  { id: "earthquakes",      label: "Seismic",           enabled: false, count: 0, color: "#FF4D6D" },
  { id: "fires",            label: "Active Fires",      enabled: false, count: 0, color: "#FF6B35" },
  { id: "launches",         label: "Launches",          enabled: true,  count: 0, color: "#00FFB2" },
  { id: "anomalies",        label: "Anomalies",         enabled: true,  count: 0, color: "#FF4D6D" },
]

export const useAstraStore = create<AstraState>((set) => ({
  satellites:  [],
  flights:     [],
  vessels:     [],
  earthquakes: [],
  fires:       [],
  launches:    [],
  anomalies:   [],
  layers:      DEFAULT_LAYERS,
  selected:    null,
  highlighted: null,
  camera:      { lat: 0, lon: 0, alt_km: 20000, mode: "orbital" },
  sidePanelOpen:  false,
  briefingOpen:   false,
  lastUpdate:     0,

  setSatellites:  (satellites)  => set({ satellites }),
  setFlights:     (flights)     => set({ flights }),
  setVessels:     (vessels)     => set({ vessels }),
  setEarthquakes: (earthquakes) => set({ earthquakes }),
  setFires:       (fires)       => set({ fires }),
  setLaunches:    (launches)    => set({ launches }),
  setAnomalies:   (anomalies)   => set({ anomalies }),

  toggleLayer: (id) =>
    set((s) => ({
      layers: s.layers.map((l) => l.id === id ? { ...l, enabled: !l.enabled } : l),
    })),

  setSelected:  (selected)    => set({ selected, sidePanelOpen: !!selected }),
  setHighlight: (highlighted) => set({ highlighted }),
  setCamera:    (c)           => set((s) => ({ camera: { ...s.camera, ...c } })),
  setViewMode:  (mode)        => set((s) => ({ camera: { ...s.camera, mode } })),
  toggleSidePanel:  ()        => set((s) => ({ sidePanelOpen: !s.sidePanelOpen })),
  toggleBriefing:   ()        => set((s) => ({ briefingOpen: !s.briefingOpen })),
  touch: () => set({ lastUpdate: Date.now() }),
}))
