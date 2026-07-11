import Link from "next/link";
import { db } from "@/lib/db";
import { items, collections } from "@/lib/db/schema";
import { ilike, and, eq, asc, desc, count } from "drizzle-orm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, EyeIcon } from "lucide-react";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { CollectionSelect } from "@/components/admin/CollectionSelect";

export const dynamic = "force-dynamic";

const GEOREF_BADGE: Record<string, string> = {
  none: "bg-gray-100 text-gray-600",
  accurate: "bg-green-100 text-green-700",
  approximate: "bg-yellow-100 text-yellow-700",
  precise: "bg-blue-100 text-blue-700",
};

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; page?: string; collectionId?: string };
}) {
  const q = searchParams.q ?? "";
  const sort = searchParams.sort ?? "title";
  const page = parseInt(searchParams.page ?? "1", 10);
  const collectionId = searchParams.collectionId ?? "";
  const limit = 50;
  const offset = (page - 1) * limit;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const conditions = [];
  if (q) conditions.push(ilike(items.title, `%${q}%`));
  if (collectionId) conditions.push(eq(items.collectionId, collectionId));
  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    sort === "recent" ? desc(items.createdAt) :
    sort === "title_desc" ? desc(items.title) :
    sort === "year" ? desc(items.yearStart) :
    asc(items.title);

  const [rows, [{ total }], allCollections] = await Promise.all([
    db.select({
      id: items.id, slug: items.slug, title: items.title, itemType: items.itemType,
      yearStart: items.yearStart, georefStatus: items.georefStatus,
      isPublished: items.isPublished, collectionId: items.collectionId,
    }).from(items).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: count() }).from(items).where(where),
    db.select({ id: collections.id, title: collections.title }).from(collections).orderBy(asc(collections.title)),
  ]);

  const collectionMap = Object.fromEntries(allCollections.map((c) => [c.id, c.title]));
  const pages = Math.ceil(total / limit);

  function buildUrl(extra: Record<string, string>) {
    const p = new URLSearchParams({
      ...(q ? { q } : {}),
      sort,
      ...(collectionId ? { collectionId } : {}),
      ...extra,
    });
    return `${base}/admin/items?${p}`;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Items</h1>
          <p className="text-sm text-muted-foreground">{total} items{collectionId ? ` în colecția selectată` : " în total"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <form method="get" action={`${base}/admin/items`} className="flex gap-2 flex-1">
          <input type="hidden" name="sort" value={sort} />
          {collectionId && <input type="hidden" name="collectionId" value={collectionId} />}
          <Input name="q" defaultValue={q} placeholder="Caută după titlu…" className="max-w-xs h-8 text-sm" />
          <button type="submit" className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
            Caută
          </button>
          {q && (
            <a href={buildUrl({ q: "", page: "1" })} className="px-3 py-1 border rounded-md text-sm hover:bg-muted">
              Resetează
            </a>
          )}
        </form>

        <CollectionSelect
          current={collectionId}
          collections={allCollections}
          preserveParams={{ ...(q ? { q } : {}), sort }}
        />

        <AdminSortSelect
          current={sort}
          preserveParams={{ ...(q ? { q } : {}), ...(collectionId ? { collectionId } : {}) }}
          options={[
            { value: "title", label: "Titlu A→Z" },
            { value: "title_desc", label: "Titlu Z→A" },
            { value: "year", label: "An descrescător" },
            { value: "recent", label: "Recente" },
          ]}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Titlu</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-32">Colecție</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-20">Tip</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-16">An</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-24">Georef</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-20">Status</th>
              <th className="px-4 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, i) => (
              <tr key={item.id} className={`border-b last:border-0 hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="px-4 py-2.5">
                  <div className="font-medium leading-tight line-clamp-1">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.slug}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground line-clamp-1">
                  {collectionMap[item.collectionId] ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.itemType}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.yearStart ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${GEOREF_BADGE[item.georefStatus] ?? GEOREF_BADGE.none}`}>
                    {item.georefStatus}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={item.isPublished ? "default" : "secondary"} className="text-xs">
                    {item.isPublished ? "Publicat" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`${base}/collections/${collectionId ? allCollections.find(c => c.id === item.collectionId)?.title ?? "" : ""}/../${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Vizualizează"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                    </a>
                    <Link
                      href={`/admin/items/${item.id}/edit`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Editează"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Link>
                    <DeleteButton
                      url={`${base}/api/admin/items/${item.id}`}
                      label={`Șterge item-ul "${item.title}"`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Niciun item găsit
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(pages, 15) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({ page: String(p) })}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
