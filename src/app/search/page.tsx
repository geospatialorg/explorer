import Link from "next/link";
import { searchItems, getFacets } from "@/lib/db/queries/search";
import { ItemCard } from "@/components/items/ItemCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, FilterIcon } from "lucide-react";
import { GEOREF_LABELS, ITEM_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; collection?: string; type?: string; georef?: string; page?: string; sort?: string };
}) {
  const q = searchParams.q ?? "";
  const page = parseInt(searchParams.page || "1", 10);

  const [{ results, total, pages }, facets] = await Promise.all([
    searchItems({ q: q || undefined, collection: searchParams.collection, type: searchParams.type, georef: searchParams.georef, page, limit: 24 }),
    getFacets(),
  ]);

  function buildUrl(extra: Record<string, string>) {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(searchParams.collection ? { collection: searchParams.collection } : {}), ...(searchParams.type ? { type: searchParams.type } : {}), ...(searchParams.georef ? { georef: searchParams.georef } : {}), ...extra });
    return `/search?${p.toString()}`;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Căutare</h1>
        <form action="/search" method="get" className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Caută în toate colecțiile…" className="pl-12 h-12 text-base rounded-xl" autoFocus />
        </form>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Facets sidebar */}
        <aside className="space-y-5">
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><FilterIcon className="h-4 w-4" /> Filtre</h3>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Tip item</p>
              {facets.types.slice(0, 8).map((f) => (
                <Link key={f.code} href={buildUrl({ type: searchParams.type === f.code ? "" : f.code })}
                  className={`flex items-center justify-between px-2 py-1 rounded text-sm transition-colors hover:bg-accent ${searchParams.type === f.code ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
                  <span>{ITEM_TYPE_LABELS[f.code ?? ""] ?? f.code}</span>
                  <span className="text-xs">{f.count}</span>
                </Link>
              ))}
            </div>

            <div className="space-y-1 mt-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Georeferențiere</p>
              {facets.georefs.map((f) => (
                <Link key={f.code} href={buildUrl({ georef: searchParams.georef === f.code ? "" : f.code })}
                  className={`flex items-center justify-between px-2 py-1 rounded text-sm transition-colors hover:bg-accent ${searchParams.georef === f.code ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
                  <span>{GEOREF_LABELS[f.code ?? ""] ?? f.code}</span>
                  <span className="text-xs">{f.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {(searchParams.type || searchParams.georef || searchParams.collection) && (
            <Link href={q ? `/search?q=${q}` : "/search"} className="block text-xs text-destructive hover:underline">
              Șterge filtrele
            </Link>
          )}
        </aside>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {q ? <><span className="font-medium text-foreground">{total}</span> rezultate pentru <span className="font-medium text-foreground">„{q}"</span></> : <><span className="font-medium text-foreground">{total}</span> items totali</>}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Niciun rezultat</p>
              {q && <p className="text-sm mt-1">Încercați termeni mai generali</p>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map(({ item, collection }) => (
                  <ItemCard key={item.id} item={item} collectionSlug={collection.slug} />
                ))}
              </div>

              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
                    <a key={p} href={buildUrl({ page: String(p) })}
                      className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
