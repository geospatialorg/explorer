import Link from "next/link";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { ilike, and, asc, desc, count } from "drizzle-orm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, EyeIcon } from "lucide-react";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; page?: string };
}) {
  const q = searchParams.q ?? "";
  const sort = searchParams.sort ?? "title";
  const page = parseInt(searchParams.page ?? "1", 10);
  const limit = 25;
  const offset = (page - 1) * limit;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const conditions = [];
  if (q) conditions.push(ilike(collections.title, `%${q}%`));
  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    sort === "recent" ? desc(collections.createdAt) :
    sort === "title_desc" ? desc(collections.title) :
    sort === "published" ? desc(collections.isPublished) :
    asc(collections.title);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(collections).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: count() }).from(collections).where(where),
  ]);

  const pages = Math.ceil(total / limit);

  function buildUrl(extra: Record<string, string>) {
    const p = new URLSearchParams({ ...(q ? { q } : {}), sort, ...extra });
    return `${base}/admin/collections?${p}`;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Colecții</h1>
          <p className="text-sm text-muted-foreground">{total} colecții în total</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <form method="get" action={`${base}/admin/collections`} className="flex gap-2 flex-1">
          <input type="hidden" name="sort" value={sort} />
          <Input name="q" defaultValue={q} placeholder="Caută după titlu…" className="max-w-xs h-8 text-sm" />
          <button type="submit" className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
            Caută
          </button>
          {q && (
            <a href={buildUrl({ q: "" })} className="px-3 py-1 border rounded-md text-sm hover:bg-muted">
              Resetează
            </a>
          )}
        </form>
        <AdminSortSelect
          current={sort}
          preserveParams={q ? { q } : {}}
          options={[
            { value: "title", label: "Titlu A→Z" },
            { value: "title_desc", label: "Titlu Z→A" },
            { value: "recent", label: "Recente" },
            { value: "published", label: "Publicate" },
          ]}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Titlu</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-24">Tip</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-20">An</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-24">Status</th>
              <th className="px-4 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((col, i) => (
              <tr key={col.id} className={`border-b last:border-0 hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="px-4 py-2.5">
                  <div className="font-medium leading-tight line-clamp-1">{col.title}</div>
                  <div className="text-xs text-muted-foreground">{col.slug}</div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{col.type ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {col.yearStart ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={col.isPublished ? "default" : "secondary"} className="text-xs">
                    {col.isPublished ? "Publicat" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`${base}/collections/${col.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Vizualizează"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                    </a>
                    <Link
                      href={`/admin/collections/${col.id}/edit`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Editează"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Link>
                    <DeleteButton
                      url={`${base}/api/admin/collections/${col.id}`}
                      label={`Șterge colecția "${col.title}"`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nicio colecție găsită
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
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
