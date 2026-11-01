import { notFound } from "next/navigation";
import Link from "next/link";
import { getItemWithResources, getNeighboringItems } from "@/lib/db/queries/items";
import { ViewerSwitcher } from "@/components/viewers/ViewerSwitcher";
import { BadgeGeoref, BadgeItemType } from "@/components/shared/BadgeGeoref";
import { CopyUrlButton } from "@/components/shared/CopyUrlButton";
import { formatYear } from "@/lib/utils";
import { ITEM_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: { slug: string; itemSlug: string };
}) {
  const data = await getItemWithResources(params.itemSlug);
  if (!data) notFound();

  const { resources, collection, ...item } = data;

  const titilerUrl = process.env.NEXT_PUBLIC_TITILER_URL || "https://services.geo-spatial.org/titiler";
  const geoserverUrl = process.env.NEXT_PUBLIC_GEOSERVER_URL || "https://services.geo-spatial.org/geoserver/wms";

  // Get neighboring items for navigation
  const neighboring = collection
    ? await getNeighboringItems(collection.id, item.id)
    : { previous: null, next: null };

  const bbox: [number, number, number, number] | undefined =
    item.bboxWest != null && item.bboxSouth != null && item.bboxEast != null && item.bboxNorth != null
      ? [item.bboxWest, item.bboxSouth, item.bboxEast, item.bboxNorth]
      : undefined;

  const cogResource = resources.find((r) => r.resourceType === "cog" && r.isPrimary);
  const wmsResource = resources.find((r) => r.resourceType === "wms" && r.isPrimary);
  const downloadResources = resources.filter(
    (r) =>
      r.resourceType === "download" ||
      r.resourceType === "cog" ||
      r.resourceType === "pdf"
  );

  const primaryDownload =
    resources.find((r) => r.resourceType === "download" && r.isPrimary) ||
    cogResource ||
    downloadResources[0];

  const xyzUrl = cogResource
    ? `${titilerUrl}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(
        cogResource.url
      )}`
    : null;

  const wmsFullUrl = wmsResource
    ? `${wmsResource.url || geoserverUrl}?SERVICE=WMS&LAYERS=${encodeURIComponent(
        wmsResource.layerName || ""
      )}`
    : null;

  const metaRows: Array<{ label: string; value: string; mono?: boolean }> = [
    (item.yearStart || item.yearEnd) && {
      label: "Perioada datelor",
      value: formatYear(item.yearStart, item.yearEnd),
    },
    item.institution && { label: "Editor", value: item.institution },
    item.author && { label: "Autor", value: item.author },
    item.scale && { label: "Scară", value: item.scale },
    item.projectionCrs && { label: "CRS", value: item.projectionCrs, mono: true },
    item.language && { label: "Limbă", value: item.language },
    item.license && { label: "Licență", value: item.license },
  ].filter(Boolean) as Array<{ label: string; value: string; mono?: boolean }>;

  const keywordsList = item.keywords
    ? item.keywords
        .flatMap((kw) => kw.split(/[|;,]+/).map((k) => k.trim()))
        .filter(Boolean)
    : [];

  return (
    <div className="flex flex-wrap">
      <section
        aria-label="Hartă"
        className="flex-[999_1_640px] min-w-0 h-[75dvh] lg:h-[860px] relative overflow-hidden bg-[#EEF1EC]"
      >
        <ViewerSwitcher
          resources={resources}
          georefStatus={item.georefStatus}
          bbox={bbox}
          titilerUrl={titilerUrl}
          geoserverUrl={geoserverUrl}
          imageSizeX={item.imageSizeX}
          imageSizeY={item.imageSizeY}
        />
      </section>

      <aside className="flex-[1_1_360px] border-t lg:border-t-0 lg:border-l border-[#E1E5EA] p-7 flex flex-col gap-[22px] bg-white">
        <nav
          aria-label="Breadcrumb"
          className="text-[13px] text-[#5B6B7A] flex flex-wrap gap-1.5"
        >
          <Link href="/collections" className="text-[#1E3448] hover:text-[#C2462E]">
            Colecții
          </Link>
          <span>/</span>
          <Link
            href={`/collections/${params.slug}`}
            className="text-[#1E3448] hover:text-[#C2462E]"
          >
            {collection?.title ?? params.slug}
          </Link>
        </nav>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2 text-[12px]">
            {item.itemType && (
              <BadgeItemType type={item.itemType} />
            )}
            <BadgeGeoref status={item.georefStatus} />
          </div>
          <h1 className="m-0 text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1E3448]">
            {item.title}
          </h1>
          {item.subtitle && (
            <p className="m-0 text-[15px] text-[#3D4F60] italic">{item.subtitle}</p>
          )}
        </div>

        {metaRows.length > 0 && (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-2.5 text-[15px]">
            {metaRows.map(({ label, value, mono }) => (
              <div key={label} className="contents">
                <dt className="text-[#5B6B7A]">{label}</dt>
                <dd
                  className={
                    mono
                      ? "m-0 font-mono text-[14px] text-[#1E3448]"
                      : "m-0 text-[#1E3448]"
                  }
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {item.notes && (
          <div className="border-t border-[#E1E5EA] pt-5 flex flex-col gap-2">
            <h2 className="m-0 font-mono text-[12px] tracking-[0.1em] text-[#5B6B7A] font-medium uppercase">
              NOTE
            </h2>
            <p className="m-0 text-[14px] leading-[1.55] text-[#3D4F60]">{item.notes}</p>
          </div>
        )}

        {keywordsList.length > 0 && (
          <div className="border-t border-[#E1E5EA] pt-5 flex flex-col gap-2.5">
            <h2 className="m-0 font-mono text-[12px] tracking-[0.1em] text-[#5B6B7A] font-medium uppercase">
              CUVINTE CHEIE
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {keywordsList.map((kw) => (
                <Link
                  key={kw}
                  href={`/search?q=${encodeURIComponent(kw)}`}
                  className="text-[12px] bg-[#F3F4F6] hover:bg-[#E1E5EA] text-[#1E3448] px-2.5 py-1 rounded-[4px] no-underline transition-colors"
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        )}

        {(xyzUrl || wmsFullUrl || primaryDownload) && (
          <div className="border-t border-[#E1E5EA] pt-5 flex flex-col gap-3">
            <h2 className="m-0 font-mono text-[12px] tracking-[0.1em] text-[#5B6B7A] font-medium uppercase">
              SERVICII ȘI DESCĂRCARE
            </h2>

            {xyzUrl && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#5B6B7A]">Tiles XYZ (TiTiler)</span>
                <div className="flex gap-1.5">
                  <code className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] bg-[#F3F4F6] p-2.5 rounded-[6px] text-[#1E3448]">
                    {xyzUrl}
                  </code>
                  <CopyUrlButton text={xyzUrl} />
                </div>
              </div>
            )}

            {wmsFullUrl && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#5B6B7A]">WMS (GeoServer)</span>
                <div className="flex gap-1.5">
                  <code className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] bg-[#F3F4F6] p-2.5 rounded-[6px] text-[#1E3448]">
                    {wmsFullUrl}
                  </code>
                  <CopyUrlButton text={wmsFullUrl} />
                </div>
              </div>
            )}

            {primaryDownload && (
              <a
                href={primaryDownload.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 text-center bg-[#1E3448] hover:bg-[#152534] text-white hover:text-white no-underline font-bold p-3.5 rounded-[8px] transition-colors"
              >
                {primaryDownload.description || "Descarcă GeoTIFF"}
              </a>
            )}
          </div>
        )}

        <div className="border-t border-[#E1E5EA] pt-5 flex justify-between gap-3 text-[15px] mt-auto">
          {neighboring.previous ? (
            <Link
              href={`/collections/${params.slug}/${neighboring.previous.slug}`}
              className="text-[#1E3448] hover:text-[#C2462E]"
            >
              ← Planșa anterioară
            </Link>
          ) : (
            <span className="text-[#5B6B7A]/50">← Planșa anterioară</span>
          )}
          {neighboring.next ? (
            <Link
              href={`/collections/${params.slug}/${neighboring.next.slug}`}
              className="text-[#1E3448] hover:text-[#C2462E]"
            >
              Următoarea →
            </Link>
          ) : (
            <span className="text-[#5B6B7A]/50">Următoarea →</span>
          )}
        </div>
      </aside>
    </div>
  );
}
