const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { next: { revalidate: 0 } })
  if (!r.ok) throw new Error(`API ${r.status}: ${path}`)
  return r.json()
}

export const api = {
  satellites:  () => get<any[]>("/satellites"),
  flights:     () => get<any[]>("/flights"),
  vessels:     () => get<any[]>("/vessels"),
  earthquakes: () => get<any[]>("/earthquakes"),
  fires:       () => get<any[]>("/fires"),
  launches:    () => get<any[]>("/launches"),
  anomalies:   () => get<any[]>("/anomalies"),
  history: (ts: number) => get<any>(`/history?ts=${ts}`),
  historyRange: () => get<{ earliest: number; latest: number }>(`/history/range`),
  briefing:    (lat: number, lon: number, radius_km: number) =>
    get<{ text: string; sources: string[] }>(`/briefing?lat=${lat}&lon=${lon}&r=${radius_km}`),
}
