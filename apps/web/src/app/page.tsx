import { GlobeScene }    from "@/components/globe/GlobeScene"
import { TopBar }        from "@/components/ui/TopBar"
import { AlertBanner }   from "@/components/ui/AlertBanner"
import { AnomalyPanel }  from "@/components/panels/AnomalyPanel"
import { SidePanel }     from "@/components/panels/SidePanel"
import { ViewControls }  from "@/components/ui/ViewControls"
import { LayerBar }      from "@/components/ui/LayerBar"
import { StatusBar }     from "@/components/ui/StatusBar"
import { TimelineBar }   from "@/components/ui/TimelineBar"
import { OrreryNav } from "@/components/ui/OrreryNav"

export default function HomePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden" style={{ background: "#030609" }}>
      <GlobeScene />
      <TopBar />
      <AlertBanner />
      <AnomalyPanel />
      <SidePanel />
      <ViewControls />
      <TimelineBar />
      <LayerBar />
      <StatusBar />
      <OrreryNav />
    </main>
  )
}