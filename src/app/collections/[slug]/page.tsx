import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionBySlug, getCollectionStats } from "@/lib/db/queries/collections";
import { getItems, getThumbnailsByItemIds } from "@/lib/db/queries/items";
import { formatYear } from "@/lib/utils";
import { FilterableItemsGrid } from "@/components/collections/CollectionSearch";

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

  const firstGeorefItem = items.find((i) => i.georefStatus !== "none") ?? items[0] ?? null;

  let downloads: Array<{ format: string; title: string; link: string }> = [];
  try {
    const raw = collection.download;
    if (Array.isArray(raw)) downloads = raw;
    else if (typeof raw === "string") downloads = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  const externalLinks =
    (collection.externalLinks as Array<{ label: string; url: string }> | null) ?? [];

  const period = formatYear(collection.yearStart, collection.yearEnd);

  return (
    <div>
      {/* Collection Hero Section */}
      <section className="bg-[#F3F4F6] border-b border-[#E1E5EA]">
        <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-12 flex flex-col gap-6">
          <nav aria-label="Breadcrumb" className="text-[14px] text-[#5B6B7A] flex flex-wrap gap-2">
            <Link href="/collections" className="text-[#1E3448] hover:text-[#C2462E] no-underline">
              Colecții
            </Link>
            <span>/</span>
            <span className="truncate">{collection.title}</span>
          </nav>

          <div className="flex flex-wrap gap-10 items-start">
            <div className="flex-[999_1_560px] flex flex-col gap-4">
              <h1 className="m-0 text-[36px] md:text-[46px] font-bold leading-[1.08] tracking-[-0.03em] text-[#1E3448]">
                {collection.title}
              </h1>

              {collection.description && (
                <p className="m-0 text-[18px] leading-[1.55] text-[#3D4F60] max-w-[720px]">
                  {collection.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-2">
                {firstGeorefItem && (
                  <Link
                    href={`/collections/${collection.slug}/${firstGeorefItem.slug}`}
                    className="bg-[#1E3448] hover:bg-[#C2462E] transition-colors text-white no-underline font-bold px-5 py-3.5 rounded-[8px]"
                  >
                    Vezi pe hartă ({Number(collStats.georef)})
                  </Link>
                )}

                {externalLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#1E3448] hover:border-[#C2462E] text-[#1E3448] hover:text-[#C2462E] transition-colors no-underline font-medium px-5 py-3 rounded-[8px] bg-white/60"
                  >
                    {link.label || "Intrare catalog geo-spatial.org"}
                  </a>
                ))}

                {downloads.map((dl, idx) => (
                  <a
                    key={idx}
                    href={dl.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#1E3448] hover:border-[#C2462E] text-[#1E3448] hover:text-[#C2462E] transition-colors no-underline font-medium px-5 py-3 rounded-[8px] bg-white/60"
                  >
                    {dl.title} ({dl.format.toUpperCase()})
                  </a>
                ))}
              </div>
            </div>

            <dl className="flex-[1_1_280px] m-0 bg-white border border-[#E1E5EA] rounded-[12px] p-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-[15px]">
              {period && (
                <>
                  <dt className="text-[#5B6B7A]">Ediție</dt>
                  <dd className="m-0 text-[#1E3448]">{period}</dd>
                </>
              )}
              {(collection.institution || collection.author) && (
                <>
                  <dt className="text-[#5B6B7A]">Editor</dt>
                  <dd className="m-0 text-[#1E3448]">
                    {collection.institution || collection.author}
                  </dd>
                </>
              )}
              <dt className="text-[#5B6B7A]">Planșe</dt>
              <dd className="m-0 text-[#1E3448]">{Number(collStats.total).toLocaleString()}</dd>

              <dt className="text-[#5B6B7A]">Georeferențiate</dt>
              <dd className="m-0 text-[#8F2F1E] font-medium">
                {Number(collStats.georef).toLocaleString()}
              </dd>

              {collection.license && (
                <>
                  <dt className="text-[#5B6B7A]">Licență</dt>
                  <dd className="m-0 text-[#1E3448]">{collection.license}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* Filterable items grid */}
      <FilterableItemsGrid
        items={items}
        collectionSlug={params.slug}
        thumbnailsByItemId={thumbnailsByItemId}
        total={total}
      />
    </div>
  );
}
