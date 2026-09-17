import { GlobeScene }   from "@/components/globe/GlobeScene"
import { TopBar }       from "@/components/ui/TopBar"
import { SidePanel }    from "@/components/panels/SidePanel"
import { AnomalyPanel } from "@/components/panels/AnomalyPanel"
import { LayerBar }     from "@/components/ui/LayerBar"
import { StatusBar }    from "@/components/ui/StatusBar"
import { AlertBanner }  from "@/components/ui/AlertBanner"

export default function HomePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-space">
      <GlobeScene />
      <TopBar />
      <AlertBanner />
      <AnomalyPanel />
      <SidePanel />
      <LayerBar />
      <StatusBar />
    </main>
  )
}