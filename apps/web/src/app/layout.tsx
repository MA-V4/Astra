import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ASTRA — Orbital Intelligence",
  description: "Live geospatial intelligence from orbital perspective. Satellites, flights, vessels, anomalies.",
  keywords: ["satellites", "OSINT", "geospatial", "orbital", "intelligence"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
