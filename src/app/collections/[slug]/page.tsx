import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionBySlug, getCollectionStats } from "@/lib/db/queries/collections";
import { getItems } from "@/lib/db/queries/items";
import { ItemCard } from "@/components/items/ItemCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatYear } from "@/lib/utils";
import { CalendarIcon, BuildingIcon, ScaleIcon, BookOpenIcon, ArrowLeftIcon, LayersIcon, GlobeIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { q?: string; type?: string; georef?: string; page?: string; sort?: string };
}) {
  const collection = await getCollectionBySlug(params.slug);
  if (!collection) notFound();

  const collStats = await getCollectionStats(collection.id);
  const page = parseInt(searchParams.page || "1", 10);
  const { items, total, pages } = await getItems({
    collectionId: collection.id,
    q: searchParams.q,
    type: searchParams.type,
    georef: searchParams.georef,
    sort: searchParams.sort || "title",
    page,
    limit: 24,
    publishedOnly: true,
  });

  const thumbnailsByItemId: Record<string, string> = {};
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/collections" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Colecții
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{collection.title}</span>
      </nav>

      {/* Collection header */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {collection.type && <Badge variant="outline">{collection.type}</Badge>}
          <h1 className="text-3xl font-bold leading-tight">{collection.title}</h1>
          {collection.description && (
            <p className="text-muted-foreground leading-relaxed">{collection.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {(collection.yearStart || collection.yearEnd) && (
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                {formatYear(collection.yearStart, collection.yearEnd)}
              </span>
            )}
            {collection.author && (
              <span className="flex items-center gap-1.5">
                <BookOpenIcon className="h-4 w-4" /> {collection.author}
              </span>
            )}
            {collection.institution && (
              <span className="flex items-center gap-1.5">
                <BuildingIcon className="h-4 w-4" /> {collection.institution}
              </span>
            )}
            {collection.license && (
              <span className="flex items-center gap-1.5">
                <ScaleIcon className="h-4 w-4" /> {collection.license}
              </span>
            )}
          </div>
          {collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {collection.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-muted/50 rounded-xl p-5 space-y-3 self-start">
          <h3 className="font-semibold text-sm">Statistici colecție</h3>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total items</span><span className="font-medium">{Number(collStats.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Georeferențiate</span><span className="font-medium text-blue-600">{Number(collStats.georef)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Publicate</span><span className="font-medium text-green-600">{Number(collStats.published)}</span></div>
          </div>
          {(collection.externalLinks as Array<{ label: string; url: string }> | null)?.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
              className="block text-sm text-primary hover:underline truncate">
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <Separator />

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Items ({total})</h2>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <LayersIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Niciun item găsit</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  collectionSlug={params.slug}
                  thumbnailUrl={thumbnailsByItemId[item.id]}
                />
              ))}
            </div>

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
                  <a key={p} href={`/collections/${params.slug}?page=${p}`}
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
  );
}
