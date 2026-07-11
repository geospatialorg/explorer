import { notFound } from "next/navigation";
import Link from "next/link";
import { getItemWithResources, getNeighboringItems } from "@/lib/db/queries/items";
import { ViewerSwitcher } from "@/components/viewers/ViewerSwitcher";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatYear } from "@/lib/utils";
import { ITEM_TYPE_LABELS } from "@/lib/constants";
import { ArrowLeftIcon, CalendarIcon, GlobeIcon, FileTextIcon, TagIcon, InfoIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: { slug: string; itemSlug: string };
}) {
  const data = await getItemWithResources(params.itemSlug);
  if (!data) notFound();

  const { resources, collection, ...item } = data;

  const titilerUrl = process.env.NEXT_PUBLIC_TITILER_URL;
  const geoserverUrl = process.env.NEXT_PUBLIC_GEOSERVER_URL;

  // Get neighboring items for navigation
  const neighboring = collection ? await getNeighboringItems(collection.id, item.id) : { previous: null, next: null };

  const bbox: [number, number, number, number] | undefined =
    item.bboxWest != null && item.bboxSouth != null && item.bboxEast != null && item.bboxNorth != null
      ? [item.bboxWest, item.bboxSouth, item.bboxEast, item.bboxNorth]
      : undefined;

  const metaRows: Array<{ label: string; value: string }> = [
    item.itemType && { label: "Tip", value: ITEM_TYPE_LABELS[item.itemType] ?? item.itemType },
    (item.yearStart || item.yearEnd) && { label: "An", value: formatYear(item.yearStart, item.yearEnd) },
    item.language && { label: "Limbă", value: item.language },
    item.georefStatus && { label: "Georeferențiere", value: item.georefStatus === "none" ? "Nu" : "Da" },
    item.scale && { label: "Scară", value: item.scale },
    item.projectionCrs && { label: "CRS", value: item.projectionCrs },
    item.author && { label: "Autor", value: item.author },
    item.institution && { label: "Instituție", value: item.institution },
    item.license && { label: "Licență", value: item.license },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/collections" className="hover:text-foreground">Colecții</Link>
        <span>/</span>
        <Link href={`/collections/${params.slug}`} className="hover:text-foreground flex items-center gap-1">
          <ArrowLeftIcon className="h-3 w-3" />
          {collection?.title ?? params.slug}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">{item.title}</span>
      </nav>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Viewer area - 3/5 width */}
        <div className="lg:col-span-3 space-y-4">
          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            {neighboring.previous ? (
              <Link href={`/collections/${params.slug}/${neighboring.previous.slug}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
              </Link>
            ) : (
              <div />
            )}
            
            <div className="text-center text-sm text-muted-foreground max-w-xs truncate">
              {item.title}
            </div>
            
            {neighboring.next ? (
              <Link href={`/collections/${params.slug}/${neighboring.next.slug}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <span className="hidden sm:inline">Urmator</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-tight">{item.title}</h1>
              {item.subtitle && <p className="text-sm text-muted-foreground italic">{item.subtitle}</p>}
            </div>
          </div>

          <div className="h-[520px] rounded-xl overflow-hidden border bg-muted">
            <ViewerSwitcher
              resources={resources}
              georefStatus={item.georefStatus}
              bbox={bbox}
              titilerUrl={titilerUrl}
              geoserverUrl={geoserverUrl}
              imageSizeX={item.imageSizeX}
              imageSizeY={item.imageSizeY}
            />
          </div>
        </div>

        {/* Metadata panel - 2/5 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata */}
          <div className="bg-muted/30 rounded-xl border p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <InfoIcon className="h-4 w-4" /> Metadate
            </h2>
            <Separator />
            <dl className="space-y-2.5">
              {metaRows.map(({ label, value }) => (
                <div key={label} className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="bg-muted/30 rounded-xl border p-5 space-y-3">
              <h2 className="font-semibold flex items-center gap-2 text-sm">
                <FileTextIcon className="h-4 w-4" /> Note
              </h2>
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Keywords */}
          {item.keywords && item.keywords.length > 0 && (
            <div className="bg-muted/30 rounded-xl border p-5 space-y-3">
              <h2 className="font-semibold flex items-center gap-2 text-sm">
                <TagIcon className="h-4 w-4" /> Cuvinte cheie
              </h2>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {item.keywords.flatMap((kw) => kw.split(/[|;,]+/).map((k) => k.trim()).filter(Boolean)).map((kw) => (
                  <Link key={kw} href={`/search?q=${encodeURIComponent(kw)}`}>
                    <Badge variant="secondary" className="text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer">
                      {kw}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div className="bg-muted/30 rounded-xl border p-5 space-y-3">
              <h2 className="font-semibold flex items-center gap-2 text-sm">
                <GlobeIcon className="h-4 w-4" /> Resurse
              </h2>
              <Separator />
              <ul className="space-y-2">
                {resources.map((r) => (
                  <li key={r.id} className="text-sm">
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1.5 truncate">
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs bg-muted border">{r.resourceType}</span>
                      <span className="truncate">{r.url}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
