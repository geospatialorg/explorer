import { getCollections, getAllCollectionStats, getSiteStats } from "@/lib/db/queries/collections";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, MapIcon, LayersIcon, GlobeIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; sort?: string; page?: string };
}) {
  const q = searchParams.q;
  const type = searchParams.type;
  const sort = searchParams.sort || "title";
  const page = parseInt(searchParams.page || "1", 10);

  const [{ collections, total, pages }, stats, allStats] = await Promise.all([
    getCollections({ q, type, sort, page, limit: 24, publishedOnly: true }),
    getSiteStats(),
    getAllCollectionStats(),
  ]);

  const statsByCollection = Object.fromEntries(
    allStats.map((s) => [s.collectionId, s])
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: MapIcon, label: "Colecții", value: stats.collections },
          { icon: LayersIcon, label: "Items totali", value: stats.items },
          { icon: GlobeIcon, label: "Georeferențiate", value: stats.georeferenced },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form className="flex-1 relative" action="/collections" method="get">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Caută colecții…"
            className="pl-9"
          />
          {type && <input type="hidden" name="type" value={type} />}
        </form>
        <Select defaultValue={sort} name="sort">
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sortare" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Titlu (A-Z)</SelectItem>
            <SelectItem value="title_desc">Titlu (Z-A)</SelectItem>
            <SelectItem value="year">An (desc.)</SelectItem>
            <SelectItem value="recent">Recente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {collections.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MapIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nicio colecție găsită</p>
          <p className="text-sm mt-1">Modificați criteriile de căutare sau adăugați colecții prin Admin → Ingestie CSV.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{total} colecții</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/collections?${new URLSearchParams({ ...(q ? { q } : {}), ...(type ? { type } : {}), sort, page: String(p) })}`}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
