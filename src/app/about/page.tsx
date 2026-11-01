const FEATURES = [
  {
    n: "01",
    title: "Colecții organizate",
    text: "Materiale grupate pe colecții tematice sau geografice.",
  },
  {
    n: "02",
    title: "Vizualizare georeferențiată",
    text: "Hărți georeferențiate vizualizate prin TiTiler COG pe fond cartografic OSM.",
  },
  {
    n: "03",
    title: "Scanări WMS",
    text: "Acces la scanările originale prin servicii WMS GeoServer.",
  },
  {
    n: "04",
    title: "Căutare avansată",
    text: "Filtrare după tip, an, georeferențiere și cuvinte cheie.",
  },
];

const LAYERS = [
  {
    layer: "INTERFAȚĂ",
    tech: ["Next.js 14", "TailwindCSS", "OpenLayers"],
  },
  {
    layer: "DATE",
    tech: ["PostgreSQL", "PostGIS", "Drizzle ORM"],
  },
  {
    layer: "RASTER",
    tech: ["TiTiler", "Cloud Optimized GeoTIFF"],
  },
  {
    layer: "SERVICII OGC",
    tech: ["GeoServer WMS"],
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="max-w-[1280px] mx-auto px-6 pt-[72px] pb-12 flex flex-wrap gap-12">
        <div className="flex-[999_1_560px] flex flex-col gap-5">
          <h1 className="m-0 text-[clamp(2.25rem,4vw+1rem,3.25rem)] font-bold leading-[1.06] tracking-[-0.03em] text-[#1E3448]">
            Despre platformă
          </h1>
          <p className="m-0 text-[20px] leading-[1.55] text-[#3D4F60] max-w-[720px]">
            geo-spatial.org Explorer este un portal de acces la colecțiile cartografice și geografice
            digitalizate din cadrul proiectelor geo-spatial.org. Platforma permite navigarea, căutarea
            și vizualizarea hărților istorice, atlaselor și materialelor geografice din patrimoniul
            românesc și internațional.
          </p>
        </div>

        <div className="flex-[1_1_280px] bg-[#1E3448] text-white rounded-[16px] p-8 flex flex-col gap-3.5 self-start">
          <span className="font-mono text-[12px] tracking-[0.1em] text-[#B9C6D2]">
            COD DESCHIS
          </span>
          <p className="m-0 text-[18px] leading-[1.45]">
            Codul sursă este public pe GitHub. Contribuțiile sunt binevenite.
          </p>
          <a
            href="https://github.com/geospatialorg/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start bg-white text-[#1E3448] hover:text-[#C2462E] no-underline font-bold px-[18px] py-3 rounded-[8px] transition-colors"
          >
            geospatialorg/explorer
          </a>
        </div>
      </section>

      <section className="bg-[#F3F4F6]">
        <div className="max-w-[1280px] mx-auto px-6 py-16 flex flex-col gap-8">
          <h2 className="m-0 text-[32px] font-bold tracking-[-0.02em] text-[#1E3448]">
            Funcționalități
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.n}
                className="bg-white rounded-[14px] p-7 flex flex-col gap-2.5"
              >
                <span className="font-mono text-[13px] text-[#C2462E]">{f.n}</span>
                <h3 className="m-0 text-[20px] font-bold text-[#1E3448]">{f.title}</h3>
                <p className="m-0 text-[15px] leading-[1.55] text-[#3D4F60]">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-6 py-16 flex flex-col gap-7">
        <h2 className="m-0 text-[32px] font-bold tracking-[-0.02em] text-[#1E3448]">
          Arhitectură
        </h2>
        <div className="flex flex-wrap items-stretch gap-3">
          {LAYERS.map((l) => (
            <div
              key={l.layer}
              className="flex-[1_1_220px] border border-[#E1E5EA] rounded-[12px] p-5 flex flex-col gap-2.5"
            >
              <span className="font-mono text-[12px] tracking-[0.1em] text-[#5B6B7A]">
                {l.layer}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {l.tech.map((t) => (
                  <span
                    key={t}
                    className="text-[14px] bg-[#F3F4F6] text-[#1E3448] px-2.5 py-1.5 rounded-[6px]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
