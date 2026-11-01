import Link from "next/link";
import { getCollections, getAllCollectionStats, getSiteStats } from "@/lib/db/queries/collections";
import { CollectionCard } from "@/components/collections/CollectionCard";

export const dynamic = "force-dynamic";

const TYPE_FILTERS = [
  { code: "", label: "Toate" },
  { code: "atlas", label: "Atlase" },
  { code: "serie", label: "Hărți topografice" },
  { code: "colectie", label: "Colecții" },
];

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; sort?: string; page?: string };
}) {
  const q = searchParams.q;
  const type = searchParams.type || "";
  const sort = searchParams.sort || "year";
  const page = parseInt(searchParams.page || "1", 10);

  const [{ collections, pages }, stats, allStats] = await Promise.all([
    getCollections({ q, type: type || undefined, sort, page, limit: 24, publishedOnly: true }),
    getSiteStats(),
    getAllCollectionStats(),
  ]);

  const statsByCollection = Object.fromEntries(
    allStats.map((s) => [s.collectionId, s])
  );

  function buildUrl(extra: Record<string, string>) {
    const params = new URLSearchParams();
    const nextQ = extra.q !== undefined ? extra.q : q;
    const nextType = extra.type !== undefined ? extra.type : type;
    const nextSort = extra.sort !== undefined ? extra.sort : sort;
    const nextPage = extra.page !== undefined ? extra.page : "1";

    if (nextQ) params.set("q", nextQ);
    if (nextType) params.set("type", nextType);
    if (nextSort && nextSort !== "year") params.set("sort", nextSort);
    if (nextPage && nextPage !== "1") params.set("page", nextPage);

    const qs = params.toString();
    return qs ? `/collections?${qs}` : "/collections";
  }

  return (
    <div>
      {/* Header & stats */}
      <section className="max-w-[1280px] mx-auto px-6 pt-14 pb-8 flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-3 max-w-[640px]">
          <h1 className="m-0 text-[40px] md:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-[#1E3448]">
            Colecții
          </h1>
          <p className="m-0 text-[18px] leading-[1.5] text-[#3D4F60]">
            Materiale cartografice și geografice digitalizate, grupate pe colecții tematice sau geografice.
          </p>
        </div>

        <dl className="m-0 flex flex-wrap gap-8">
          <div className="flex flex-col-reverse gap-0.5">
            <dt className="text-[14px] text-[#5B6B7A]">colecții</dt>
            <dd className="m-0 text-[32px] font-bold text-[#1E3448]">
              {Number(stats.collections).toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-col-reverse gap-0.5">
            <dt className="text-[14px] text-[#5B6B7A]">planșe</dt>
            <dd className="m-0 text-[32px] font-bold text-[#1E3448]">
              {Number(stats.items).toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-col-reverse gap-0.5">
            <dt className="text-[14px] text-[#5B6B7A]">georeferențiate</dt>
            <dd className="m-0 text-[32px] font-bold text-[#C2462E]">
              {Number(stats.georeferenced).toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>

      {/* Filter & sort bar */}
      <section className="max-w-[1280px] mx-auto px-6 pb-5 flex flex-wrap justify-between items-center gap-4 border-b border-[#E1E5EA]">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => {
            const active = type === f.code;
            return (
              <Link
                key={f.label}
                href={buildUrl({ type: f.code, page: "1" })}
                className={`text-[15px] px-4 py-2.5 rounded-full border no-underline transition-colors ${
                  active
                    ? "border-[#1E3448] bg-[#1E3448] text-white font-medium"
                    : "border-[#C9D1D9] bg-white text-[#1E3448] hover:border-[#1E3448]"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <form
          action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/collections`}
          method="get"
          className="flex flex-wrap items-center gap-3"
        >
          {type && <input type="hidden" name="type" value={type} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Filtrează colecții…"
            className="text-[15px] px-3.5 py-2 border border-[#C9D1D9] rounded-[8px] text-[#1E3448] bg-white outline-none focus:border-[#1E3448]"
          />
          <label className="flex items-center gap-2 text-[15px] text-[#5B6B7A]">
            Sortare
            <select
              name="sort"
              defaultValue={sort}
              className="text-[15px] px-3 py-2 border border-[#C9D1D9] rounded-[8px] text-[#1E3448] bg-white outline-none focus:border-[#1E3448]"
            >
              <option value="year">An publicare</option>
              <option value="title">Alfabetic (A-Z)</option>
              <option value="title_desc">Alfabetic (Z-A)</option>
              <option value="recent">Adăugate recent</option>
            </select>
          </label>
          <button
            type="submit"
            className="text-[14px] font-medium px-3.5 py-2 rounded-[8px] bg-[#F3F4F6] hover:bg-[#E1E5EA] text-[#1E3448] transition-colors"
          >
            Aplică
          </button>
        </form>
      </section>

      {/* Collections list */}
      <section className="max-w-[1280px] mx-auto px-6 pt-8 pb-20 flex flex-col gap-6">
        {collections.length === 0 ? (
          <div className="py-16 text-center text-[#5B6B7A]">
            <p className="text-[18px] font-medium text-[#1E3448] m-0">Nicio colecție găsită</p>
            <p className="text-[15px] mt-2">
              Modificați filtrele sau adăugați colecții prin panoul de administrare.
            </p>
          </div>
        ) : (
          <>
            {collections.map((col) => {
              const s = statsByCollection[col.id];
              return (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  itemCount={Number(s?.total ?? 0)}
                  georefCount={Number(s?.georef ?? 0)}
                />
              );
            })}

            <p className="m-0 text-[15px] text-[#5B6B7A]">
              Noi colecții sunt în curs de digitalizare și ingestie.
            </p>

            {pages > 1 && (
              <nav
                aria-label="Paginare"
                className="flex justify-center gap-1.5 mt-6 text-[15px]"
              >
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
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
          </>
        )}
      </section>
    </div>
  );
}
