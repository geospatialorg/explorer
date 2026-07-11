import { MapIcon, DatabaseIcon, LayersIcon, GlobeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <MapIcon className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">geo-spatial.org Explorer</h1>
          <p className="text-lg text-muted-foreground">
            Portal de explorare a colecțiilor cartografice istorice din patrimoniul geo-spatial.org
          </p>
        </div>

        <Separator />

        <div className="prose prose-sm max-w-none space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Despre platformă</h2>
            <p className="text-muted-foreground leading-relaxed">
              geo-spatial.org Explorer este un portal de acces la colecțiile cartografice și geografice
              digitalizate din cadrul proiectelor geo-spatial.org. Platforma permite navigarea, căutarea
              și vizualizarea hărților istorice, atlaselor și materialelor geografice din patrimoniul
              românesc și internațional.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Funcționalități</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: LayersIcon, title: "Colecții organizate", desc: "Materiale grupate pe colecții tematice sau geografice" },
                { icon: GlobeIcon, title: "Vizualizare georeferențiată", desc: "Hărți georef. vizualizate prin TiTiler COG pe fond cartografic OSM" },
                { icon: MapIcon, title: "Scanări WMS", desc: "Acces la scanările originale prin servicii WMS GeoServer" },
                { icon: DatabaseIcon, title: "Căutare avansată", desc: "Filtrare după tip, an, georeferențiere și cuvinte cheie" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 p-4 rounded-lg border bg-muted/30">
                  <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Tehnologii</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              {["Next.js 14", "PostgreSQL + PostGIS", "Drizzle ORM", "OpenLayers", "TiTiler", "GeoServer WMS", "TailwindCSS"].map((tech) => (
                <span key={tech} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground border text-xs">{tech}</span>
              ))}
            </div>
          </section>

          <Separator />

          <section className="text-center space-y-2 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} geo-spatial.org</p>
            <a href="https://geo-spatial.org" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline">geo-spatial.org</a>
          </section>
        </div>
      </div>
    </div>
  );
}
