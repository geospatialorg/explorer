import Link from "next/link";
import Image from "next/image";
import { getCollections, getAllCollectionStats, getSiteStats } from "@/lib/db/queries/collections";
import { searchItems, getFacets } from "@/lib/db/queries/search";
import { formatYear } from "@/lib/utils";
import { ITEM_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function encodeThumbnailUrl(url: string) {
  if (!url.startsWith("http")) return url;
  return url
    .split("/")
    .map((s, i) => (i < 3 ? s : encodeURIComponent(s)))
    .join("/");
}

export default async function HomePage() {
  const [{ collections }, stats, allStats, facets, georefItems] = await Promise.all([
    getCollections({ limit: 4, publishedOnly: true }),
    getSiteStats(),
    getAllCollectionStats(),
    getFacets(),
    searchItems({ georef: "yes", limit: 6 }),
  ]);

  const statsByCollection = Object.fromEntries(
    allStats.map((s) => [s.collectionId, s])
  );

  const featuredCollection = collections[0] ?? null;
  const featuredStats = featuredCollection
    ? statsByCollection[featuredCollection.id]
    : null;

  const heroMapItem = georefItems.results[0] ?? null;

  const topTypeFacets = facets.types.slice(0, 2);

  return (
    <div>
      {/* Hero section */}
      <section className="bg-[#1E3448] text-white">
        <div className="max-w-[1280px] mx-auto px-6 py-16 md:py-20 flex flex-wrap gap-12 items-center">
          <div className="flex-[1_1_480px] flex flex-col gap-6">
            <p className="m-0 font-mono text-[13px] tracking-[0.12em] uppercase text-[#B9C6D2]">
              Patrimoniu cartografic digitalizat
            </p>
            <h1 className="m-0 font-bold tracking-[-0.03em] leading-[1.04] text-[clamp(2.25rem,1.5rem+3vw,3.75rem)]">
              Hărți istorice, georeferențiate și deschise
            </h1>
            <p className="m-0 text-[19px] leading-[1.5] text-[#D5DEE6] max-w-[560px]">
              Navigați, căutați și suprapuneți pe harta actuală atlase și planșe din patrimoniul românesc și internațional.
            </p>

            <form
              role="search"
              action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search`}
              method="get"
              className="flex flex-wrap gap-2 bg-white p-1.5 rounded-[12px] max-w-[600px]"
            >
              <label htmlFor="home-search-q" className="sr-only">
                Caută în colecții
              </label>
              <input
                id="home-search-q"
                name="q"
                type="search"
                placeholder="ex. precipitații, județe, soluri…"
                className="flex-[1_1_240px] min-w-0 border-0 px-3.5 py-3.5 text-[17px] text-[#1E3448] bg-transparent outline-none placeholder:text-[#5B6B7A]"
              />
              <button
                type="submit"
                className="bg-[#C2462E] hover:bg-[#8F2F1E] transition-colors text-white font-bold px-6 py-3.5 rounded-[8px] cursor-pointer border-0"
              >
                Caută
              </button>
            </form>

            <div className="flex flex-wrap gap-2 text-[14px]">
              {topTypeFacets.map((f) => (
                <Link
                  key={f.code}
                  href={`/search?type=${encodeURIComponent(f.code ?? "")}`}
                  className="text-white no-underline border border-[#4A6680] hover:border-white/70 transition-colors px-3.5 py-2.5 rounded-full"
                >
                  {ITEM_TYPE_LABELS[f.code ?? ""] ?? f.code} · {Number(f.count).toLocaleString()}
                </Link>
              ))}
              <Link
                href="/search?georef=yes"
                className="text-white no-underline border border-[#4A6680] hover:border-white/70 transition-colors px-3.5 py-2.5 rounded-full"
              >
                Georeferențiate · {Number(stats.georeferenced).toLocaleString()}
              </Link>
            </div>
          </div>

          <div className="flex-[1_1_420px] h-[380px] md:h-[440px] rounded-[16px] bg-[#29445C] border border-[#3D5A73] relative overflow-hidden flex items-center justify-center">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 400 300"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-0"
            >
              <g fill="none" stroke="#4A6680" strokeWidth="1">
                <path d="M0 60 Q200 40 400 60" />
                <path d="M0 120 Q200 105 400 120" />
                <path d="M0 180 Q200 170 400 180" />
                <path d="M0 240 Q200 235 400 240" />
                <path d="M60 0 Q50 150 70 300" />
                <path d="M140 0 Q135 150 145 300" />
                <path d="M220 0 Q222 150 220 300" />
                <path d="M300 0 Q308 150 298 300" />
              </g>
            </svg>

            {heroMapItem && heroMapItem.thumbnailUrl ? (
              <Link
                href={`/collections/${heroMapItem.collection.slug}/${heroMapItem.item.slug}`}
                className="relative w-[82%] h-[82%] rounded-[10px] overflow-hidden shadow-2xl border border-[#4A6680] group block"
              >
                <Image
                  src={encodeThumbnailUrl(heroMapItem.thumbnailUrl)}
                  alt={heroMapItem.item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1E3448]/95 via-[#1E3448]/70 to-transparent p-4">
                  <span className="inline-block font-mono text-[11px] uppercase tracking-wider text-white bg-[#C2462E] px-2 py-0.5 rounded-[4px] mb-1">
                    Planșă georeferențiată
                  </span>
                  <p className="m-0 text-[14px] font-medium text-white line-clamp-1">
                    {heroMapItem.item.title}
                  </p>
                </div>
              </Link>
            ) : (
              <span className="relative font-mono text-[13px] text-[#D5DEE6] bg-[#1E3448] px-3 py-2 rounded-[6px]">
                Patrimoniu cartografic georeferențiat · TiTiler COG &amp; GeoServer WMS
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="border-b border-[#E1E5EA]">
        <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              value: Number(stats.collections).toLocaleString(),
              label: Number(stats.collections) === 1 ? "colecție" : "colecții",
            },
            {
              value: Number(stats.items).toLocaleString(),
              label: "planșe digitalizate",
            },
            {
              value: Number(stats.georeferenced).toLocaleString(),
              label: "georeferențiate",
            },
            {
              value: String(facets.types.length || 1),
              label: "tipuri de materiale",
            },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="text-[40px] font-bold tracking-[-0.02em] leading-none text-[#1E3448]">
                {s.value}
              </span>
              <span className="text-[15px] text-[#5B6B7A]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured collection */}
      {featuredCollection && (
        <section>
          <div className="max-w-[1280px] mx-auto px-6 pt-16 pb-6 flex flex-col gap-6">
            <div className="flex flex-wrap justify-between items-baseline gap-3">
              <h2 className="m-0 text-[32px] font-bold tracking-[-0.02em] text-[#1E3448]">
                Colecție recomandată
              </h2>
              {collections.length > 1 && (
                <Link
                  href="/collections"
                  className="font-medium text-[#1E3448] hover:text-[#C2462E] no-underline"
                >
                  Toate colecțiile →
                </Link>
              )}
            </div>

            <div className="flex flex-wrap border border-[#E1E5EA] rounded-[16px] overflow-hidden bg-white">
              <div className="flex-[1_1_380px] min-h-[300px] aspect-[4/3] relative bg-[#EEF0F3] flex items-center justify-center font-mono text-[13px] text-[#5B6B7A]">
                {featuredCollection.thumbnailPath ? (
                  <Image
                    src={encodeThumbnailUrl(featuredCollection.thumbnailPath)}
                    alt={featuredCollection.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span>[Coperta colecției]</span>
                )}
              </div>

              <div className="flex-[999_1_480px] p-8 md:p-10 flex flex-col gap-4 justify-center">
                <p className="m-0 font-mono text-[13px] text-[#5B6B7A]">
                  {[
                    featuredCollection.type?.toUpperCase(),
                    formatYear(featuredCollection.yearStart, featuredCollection.yearEnd),
                    featuredCollection.institution || featuredCollection.author,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h3 className="m-0 text-[28px] md:text-[30px] font-bold leading-[1.15] tracking-[-0.02em] text-[#1E3448]">
                  {featuredCollection.title}
                </h3>
                {featuredCollection.description && (
                  <p className="m-0 text-[17px] leading-[1.55] text-[#3D4F60] line-clamp-3">
                    {featuredCollection.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-[14px]">
                  <span className="bg-[#F3F4F6] text-[#1E3448] px-3 py-1.5 rounded-full">
                    {Number(featuredStats?.total ?? 0).toLocaleString()} planșe
                  </span>
                  {Number(featuredStats?.georef ?? 0) > 0 && (
                    <span className="bg-[#FBEAE6] text-[#8F2F1E] px-3 py-1.5 rounded-full font-medium">
                      {Number(featuredStats?.georef ?? 0).toLocaleString()} georeferențiate
                    </span>
                  )}
                </div>
                <Link
                  href={`/collections/${featuredCollection.slug}`}
                  className="self-start mt-2 bg-[#1E3448] hover:bg-[#C2462E] transition-colors text-white no-underline font-bold px-5 py-3.5 rounded-[8px]"
                >
                  Deschide colecția
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Georeferenced maps */}
      {georefItems.results.length > 0 && (
        <section>
          <div className="max-w-[1280px] mx-auto px-6 py-14 flex flex-col gap-6">
            <div className="flex flex-wrap justify-between items-baseline gap-3">
              <h2 className="m-0 text-[32px] font-bold tracking-[-0.02em] text-[#1E3448]">
                Hărți georeferențiate
              </h2>
              <Link
                href="/search?georef=yes"
                className="font-medium text-[#1E3448] hover:text-[#C2462E] no-underline"
              >
                Toate cele {Number(stats.georeferenced).toLocaleString()} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {georefItems.results.slice(0, 3).map(({ item, collection, thumbnailUrl }) => {
                const typeLabel = (ITEM_TYPE_LABELS[item.itemType] ?? item.itemType).toUpperCase();
                const period = formatYear(item.yearStart, item.yearEnd);
                return (
                  <Link
                    key={item.id}
                    href={`/collections/${collection.slug}/${item.slug}`}
                    className="group no-underline text-[#1E3448] flex flex-col gap-3"
                  >
                    <div className="aspect-[4/3] relative bg-[#EEF0F3] rounded-[12px] overflow-hidden flex items-center justify-center font-mono text-[12px] text-[#5B6B7A]">
                      {thumbnailUrl ? (
                        <Image
                          src={encodeThumbnailUrl(thumbnailUrl)}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <span>[Miniatură planșă]</span>
                      )}
                    </div>
                    <div className="flex gap-2 font-mono text-[12px] text-[#5B6B7A]">
                      <span>{typeLabel}</span>
                      {period && (
                        <>
                          <span>·</span>
                          <span>{period}</span>
                        </>
                      )}
                    </div>
                    <span className="text-[18px] font-medium leading-[1.3] group-hover:text-[#C2462E] transition-colors line-clamp-2">
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features section */}
      <section className="bg-[#F3F4F6]">
        <div className="max-w-[1280px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              n: "01",
              title: "Colecții organizate",
              text: "Materiale grupate pe colecții tematice sau geografice, cu metadate despre ediție și editor.",
            },
            {
              n: "02",
              title: "Vizualizare georeferențiată",
              text: "Planșele georeferențiate se suprapun peste fondul OSM, servite ca Cloud Optimized GeoTIFF prin TiTiler.",
            },
            {
              n: "03",
              title: "Scanări originale prin WMS",
              text: "Scanările integrale rămân accesibile prin servicii WMS GeoServer, pentru reutilizare în GIS.",
            },
          ].map((f) => (
            <div key={f.n} className="flex flex-col gap-2.5">
              <span className="font-mono text-[13px] text-[#C2462E]">{f.n}</span>
              <h3 className="m-0 text-[21px] font-bold text-[#1E3448]">{f.title}</h3>
              <p className="m-0 text-[16px] leading-[1.55] text-[#3D4F60]">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
