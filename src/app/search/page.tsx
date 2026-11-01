import Link from "next/link";
import Image from "next/image";
import { searchItems, getFacets } from "@/lib/db/queries/search";
import { getCollections } from "@/lib/db/queries/collections";
import { ItemCard } from "@/components/items/ItemCard";
import { BadgeGeoref } from "@/components/shared/BadgeGeoref";
import { ITEM_TYPE_LABELS } from "@/lib/constants";
import { formatYear } from "@/lib/utils";

export const dynamic = "force-dynamic";

function encodeThumbnailUrl(url: string) {
  if (!url.startsWith("http")) return url;
  return url
    .split("/")
    .map((s, i) => (i < 3 ? s : encodeURIComponent(s)))
    .join("/");
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    collection?: string;
    type?: string;
    georef?: string;
    yearMin?: string;
    yearMax?: string;
    view?: string;
    page?: string;
    sort?: string;
  };
}) {
  const q = searchParams.q ?? "";
  const page = parseInt(searchParams.page || "1", 10);
  const yearMin = searchParams.yearMin ? parseInt(searchParams.yearMin, 10) : undefined;
  const yearMax = searchParams.yearMax ? parseInt(searchParams.yearMax, 10) : undefined;
  const view = searchParams.view === "grid" ? "grid" : "list";

  const [{ results, total, pages }, facets, { collections }] = await Promise.all([
    searchItems({
      q: q || undefined,
      collection: searchParams.collection,
      type: searchParams.type,
      georef: searchParams.georef,
      yearMin,
      yearMax,
      page,
      limit: 24,
    }),
    getFacets(),
    getCollections({ limit: 100, publishedOnly: true }),
  ]);

  const totalAllItems = facets.georefs.reduce((sum, g) => sum + Number(g.count), 0);
  const totalGeoref = facets.georefs
    .filter((g) => g.code !== "none")
    .reduce((sum, g) => sum + Number(g.count), 0);
  const totalNonGeoref = facets.georefs
    .filter((g) => g.code === "none")
    .reduce((sum, g) => sum + Number(g.count), 0);

  function buildUrl(extra: Record<string, string>) {
    const base: Record<string, string> = {};
    if (q) base.q = q;
    if (searchParams.collection) base.collection = searchParams.collection;
    if (searchParams.type) base.type = searchParams.type;
    if (searchParams.georef) base.georef = searchParams.georef;
    if (searchParams.yearMin) base.yearMin = searchParams.yearMin;
    if (searchParams.yearMax) base.yearMax = searchParams.yearMax;
    if (view !== "list") base.view = view;

    const merged = { ...base, ...extra };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/search?${qs}` : "/search";
  }

  return (
    <div>
      {/* Search header */}
      <section className="border-b border-[#E1E5EA]">
        <div className="max-w-[1280px] mx-auto px-6 pt-10 pb-8 flex flex-col gap-5">
          <h1 className="m-0 text-[40px] font-bold tracking-[-0.03em] text-[#1E3448]">
            Căutare
          </h1>
          <form
            role="search"
            action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search`}
            method="get"
            className="flex flex-wrap gap-2 border border-[#C9D1D9] p-1.5 rounded-[12px] max-w-[760px] bg-white"
          >
            {searchParams.type && <input type="hidden" name="type" value={searchParams.type} />}
            {searchParams.georef && <input type="hidden" name="georef" value={searchParams.georef} />}
            {searchParams.collection && (
              <input type="hidden" name="collection" value={searchParams.collection} />
            )}
            {view !== "list" && <input type="hidden" name="view" value={view} />}
            <label htmlFor="sq" className="sr-only">
              Termeni de căutare
            </label>
            <input
              id="sq"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Caută după titlu, subtitlu, cuvinte cheie…"
              className="flex-[1_1_240px] min-w-0 border-0 p-3 text-[17px] text-[#1E3448] bg-transparent outline-none placeholder:text-[#5B6B7A]"
            />
            <button
              type="submit"
              className="bg-[#C2462E] hover:bg-[#8F2F1E] transition-colors text-white font-bold px-6 py-3 border-0 rounded-[8px] cursor-pointer"
            >
              Caută
            </button>
          </form>
        </div>
      </section>

      {/* Main layout */}
      <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-16 flex flex-wrap gap-10 items-start">
        {/* Sidebar filters */}
        <aside aria-label="Filtre" className="flex-[1_1_260px] flex flex-col gap-7">
          {/* Item Type */}
          <fieldset className="border-0 m-0 p-0 flex flex-col gap-1">
            <legend className="font-mono text-[12px] tracking-[0.1em] text-[#5B6B7A] uppercase mb-2">
              TIP MATERIAL
            </legend>
            {facets.types.map((t) => {
              const code = t.code ?? "";
              const checked = searchParams.type === code;
              return (
                <Link
                  key={code}
                  href={buildUrl({ type: checked ? "" : code, page: "" })}
                  className="flex items-center gap-2.5 min-h-[38px] text-[15px] text-[#1E3448] hover:text-[#C2462E] no-underline"
                >
                  <span
                    aria-hidden="true"
                    className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center text-[12px] ${
                      checked
                        ? "bg-[#1E3448] border-[#1E3448] text-white"
                        : "border-[#C9D1D9] bg-white"
                    }`}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="flex-1">{ITEM_TYPE_LABELS[code] ?? code}</span>
                  <span className="font-mono text-[12px] text-[#5B6B7A]">
                    {Number(t.count).toLocaleString()}
                  </span>
                </Link>
              );
            })}
          </fieldset>

          {/* Georeferencing */}
          <fieldset className="border-0 m-0 p-0 flex flex-col gap-1">
            <legend className="font-mono text-[12px] tracking-[0.1em] text-[#5B6B7A] uppercase mb-2">
              GEOREFERENȚIERE
            </legend>
            {[
              { code: "", label: "Toate", count: totalAllItems },
              { code: "yes", label: "Georeferențiate", count: totalGeoref },
              { code: "none", label: "Negeoreferențiate", count: totalNonGeoref },
            ].map((g) => {
              const active =
                (g.code === "" && !searchParams.georef) ||
                (g.code === "yes" &&
                  (searchParams.georef === "yes" ||
                    searchParams.georef === "accurate" ||
                    searchParams.georef === "approximate" ||
                    searchParams.georef === "precise")) ||
                (g.code === "none" && searchParams.georef === "none");
              return (
                <Link
                  key={g.label}
                  href={buildUrl({ georef: g.code, page: "" })}
                  className="flex items-center gap-2.5 min-h-[38px] text-[15px] text-[#1E3448] hover:text-[#C2462E] no-underline"
                >
                  <span
                    aria-hidden="true"
                    className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center ${
                      active ? "border-[#1E3448]" : "border-[#C9D1D9]"
                    }`}
                  >
                    {active && <span className="w-2.5 h-2.5 rounded-full bg-[#1E3448]" />}
                  </span>
                  <span className="flex-1">{g.label}</span>
                  <span className="font-mono text-[12px] text-[#5B6B7A]">
                    {g.count.toLocaleString()}
                  </span>
                </Link>
              );
            })}
          </fieldset>

          {/* Period & Collection form */}
          <form
            action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search`}
            method="get"
            className="flex flex-col gap-6"
          >
            {q && <input type="hidden" name="q" value={q} />}
            {searchParams.type && <input type="hidden" name="type" value={searchParams.type} />}
            {searchParams.georef && <input type="hidden" name="georef" value={searchParams.georef} />}
            {view !== "list" && <input type="hidden" name="view" value={view} />}

            <fieldset className="border-0 m-0 p-0 flex flex-col gap-2.5">
              <legend className="font-mono text-[12px] tracking-[0.1em] text-[#5B6B7A] uppercase mb-2">
                PERIOADA DATELOR
              </legend>
              <div className="flex gap-2 items-center">
                <label className="flex flex-col gap-1 text-[13px] text-[#5B6B7A] flex-1">
                  De la
                  <input
                    type="number"
                    name="yearMin"
                    defaultValue={searchParams.yearMin ?? ""}
                    placeholder="1850"
                    className="text-[15px] p-2.5 border border-[#C9D1D9] rounded-[8px] text-[#1E3448] min-w-0 bg-white outline-none focus:border-[#1E3448]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[13px] text-[#5B6B7A] flex-1">
                  Până la
                  <input
                    type="number"
                    name="yearMax"
                    defaultValue={searchParams.yearMax ?? ""}
                    placeholder="1950"
                    className="text-[15px] p-2.5 border border-[#C9D1D9] rounded-[8px] text-[#1E3448] min-w-0 bg-white outline-none focus:border-[#1E3448]"
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="border-0 m-0 p-0 flex flex-col gap-2.5">
              <legend className="font-mono text-[12px] tracking-[0.1em] text-[#5B6B7A] uppercase mb-2">
                COLECȚIE
              </legend>
              <select
                name="collection"
                defaultValue={searchParams.collection ?? ""}
                aria-label="Colecție"
                className="text-[15px] p-2.5 border border-[#C9D1D9] rounded-[8px] text-[#1E3448] bg-white outline-none focus:border-[#1E3448]"
              >
                <option value="">Toate colecțiile</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </fieldset>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="text-[14px] font-medium px-4 py-2 rounded-[8px] bg-[#1E3448] text-white hover:bg-[#C2462E] transition-colors border-0 cursor-pointer"
              >
                Aplică filtrele
              </button>

              {(searchParams.type ||
                searchParams.georef ||
                searchParams.collection ||
                searchParams.yearMin ||
                searchParams.yearMax) && (
                <Link
                  href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"}
                  className="text-[13px] text-[#C2462E] hover:underline no-underline"
                >
                  Resetează
                </Link>
              )}
            </div>
          </form>
        </aside>

        {/* Results */}
        <section className="flex-[999_1_560px] min-w-0 flex flex-col gap-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="m-0 text-[15px] text-[#5B6B7A]">
              <b className="text-[#1E3448]">{Number(total).toLocaleString()}</b> rezultate
              {q ? (
                <>
                  {" "}
                  pentru <b className="text-[#1E3448]">„{q}"</b>
                </>
              ) : null}
            </p>

            <div
              role="group"
              aria-label="Mod afișare"
              className="flex border border-[#C9D1D9] rounded-[8px] overflow-hidden text-[14px]"
            >
              <Link
                href={buildUrl({ view: "" })}
                aria-current={view === "list" ? "page" : undefined}
                className={`px-4 py-2.5 no-underline transition-colors ${
                  view === "list"
                    ? "bg-[#1E3448] text-white font-medium"
                    : "bg-white text-[#1E3448] hover:bg-[#F3F4F6]"
                }`}
              >
                Listă
              </Link>
              <Link
                href={buildUrl({ view: "grid" })}
                aria-current={view === "grid" ? "page" : undefined}
                className={`px-4 py-2.5 no-underline transition-colors ${
                  view === "grid"
                    ? "bg-[#1E3448] text-white font-medium"
                    : "bg-white text-[#1E3448] hover:bg-[#F3F4F6]"
                }`}
              >
                Grilă
              </Link>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="py-16 text-center text-[#5B6B7A] border-t border-[#E1E5EA]">
              <p className="text-[18px] font-medium text-[#1E3448] m-0">Niciun rezultat găsit</p>
              <p className="text-[15px] mt-1">Încercați termeni mai generali sau resetați filtrele.</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2">
              {results.map(({ item, collection, thumbnailUrl }) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  collectionSlug={collection.slug}
                  thumbnailUrl={thumbnailUrl || undefined}
                />
              ))}
            </div>
          ) : (
            <ol className="list-none m-0 p-0 flex flex-col">
              {results.map(({ item, collection, thumbnailUrl }) => {
                const typeLabel = (
                  ITEM_TYPE_LABELS[item.itemType] ?? item.itemType
                ).toUpperCase();
                const period = formatYear(item.yearStart, item.yearEnd);
                return (
                  <li key={item.id} className="border-t border-[#E1E5EA]">
                    <Link
                      href={`/collections/${collection.slug}/${item.slug}`}
                      className="group flex gap-5 py-5 no-underline text-[#1E3448]"
                    >
                      <div className="flex-[0_0_96px] h-[120px] relative bg-[#EEF0F3] rounded-[8px] overflow-hidden flex items-center justify-center font-mono text-[11px] text-[#5B6B7A]">
                        {thumbnailUrl ? (
                          <Image
                            src={encodeThumbnailUrl(thumbnailUrl)}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <span>[thumb]</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2 font-mono text-[12px] text-[#5B6B7A]">
                          <span>{typeLabel}</span>
                          {period && (
                            <>
                              <span>·</span>
                              <span>{period}</span>
                            </>
                          )}
                        </div>

                        <span className="text-[19px] font-medium leading-[1.3] group-hover:text-[#C2462E] transition-colors">
                          {item.title}
                        </span>

                        <span className="text-[14px] text-[#5B6B7A] truncate">
                          {collection.title}
                        </span>

                        <div className="self-start">
                          <BadgeGeoref status={item.georefStatus} variant="inline" />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}

          {pages > 1 && (
            <nav
              aria-label="Paginare"
              className="flex flex-wrap justify-center gap-1.5 mt-6 text-[15px]"
            >
              {Array.from({ length: Math.min(pages, 12) }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildUrl({ page: String(p) })}
                  aria-current={p === page ? "page" : undefined}
                  className={`min-w-[44px] h-[44px] flex items-center justify-center rounded-[8px] no-underline transition-colors ${
                    p === page
                      ? "bg-[#1E3448] text-white font-medium"
                      : "border border-[#E1E5EA] text-[#1E3448] hover:border-[#1E3448]"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
