import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionBySlug, getCollectionStats } from "@/lib/db/queries/collections";
import { getItems, getThumbnailsByItemIds } from "@/lib/db/queries/items";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatYear } from "@/lib/utils";
import { CalendarIcon, BuildingIcon, ScaleIcon, BookOpenIcon, ArrowLeftIcon, GlobeIcon, FileTextIcon, ArchiveIcon, FileImageIcon, DownloadIcon } from "lucide-react";
import { FilterableItemsGrid } from "@/components/collections/CollectionSearch";

function getFileIcon(format: string) {
  const lowerFormat = format.toLowerCase();
  switch (lowerFormat) {
    case 'pdf':
      return <FileTextIcon className="h-3 w-3" />;
    case 'zip':
    case '7z':
    case 'rar':
      return <ArchiveIcon className="h-3 w-3" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'tiff':
    case 'tif':
    case 'geotiff':
      return <FileImageIcon className="h-3 w-3" />;
    default:
      return <DownloadIcon className="h-3 w-3" />;
  }
}

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
  const { items, total } = await getItems({
    collectionId: collection.id,
    type: searchParams.type,
    georef: searchParams.georef,
    sort: searchParams.sort || "order",
    page: 1,
    limit: 9999,
    publishedOnly: true,
  });

  const thumbnailsByItemId = await getThumbnailsByItemIds(items.map((i) => i.id));
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
            <div className="flex justify-between"><span className="text-muted-foreground">Total {collection.itemType || 'items'}</span><span className="font-medium">{Number(collStats.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Georeferențiate</span><span className="font-medium text-blue-600">{Number(collStats.georef)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Publicate</span><span className="font-medium text-green-600">{Number(collStats.published)}</span></div>
          </div>
          {(collection.externalLinks as Array<{ label: string; url: string }> | null)?.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate">
              <GlobeIcon className="h-3 w-3 flex-shrink-0" />
              Intrare catalog geo-spatial.org
            </a>
          ))}
          
          {/* Download Section */}
          {(() => {
            let downloads: Array<{ format: string; title: string; link: string }> = [];
            try {
              const raw = collection.download;
              if (Array.isArray(raw)) downloads = raw;
              else if (typeof raw === 'string') downloads = JSON.parse(raw);
            } catch { /* ignore */ }
            return downloads.length > 0 ? (
              <div className="pt-3 border-t space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Descărcare</h4>
                <div className="space-y-1">
                  {downloads.map((dl, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs truncate">
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-[9px] font-medium">
                        {getFileIcon(dl.format)}
                        {dl.format}
                      </span>
                      <a href={dl.link} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline truncate">
                        {dl.title}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      <Separator />

      {/* Items */}
      <FilterableItemsGrid
        items={items}
        collectionSlug={params.slug}
        thumbnailsByItemId={thumbnailsByItemId}
        total={total}
      />
    </div>
  );
}
