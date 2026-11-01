import { db } from "@/lib/db";
import { items, collections, resources } from "@/lib/db/schema";
import { eq, ilike, and, sql, desc, asc, count, or, inArray } from "drizzle-orm";

export async function searchItems(opts: {
  q?: string;
  collection?: string;
  type?: string;
  georef?: string;
  yearMin?: number;
  yearMax?: number;
  hasVector?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}) {
  const {
    q, collection, type, georef, yearMin, yearMax,
    hasVector, page = 1, limit = 24, sort = "relevance",
  } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(items.isPublished, true)];

  if (q) {
    conditions.push(
      or(
        ilike(items.title, `%${q}%`),
        ilike(items.subtitle, `%${q}%`),
        ilike(items.notes, `%${q}%`),
        sql`${items.keywords} && ARRAY[${q}]::text[]`
      )!
    );
  }
  if (collection) {
    const coll = await db.query.collections.findFirst({ where: eq(collections.slug, collection) });
    if (coll) conditions.push(eq(items.collectionId, coll.id));
  }
  if (type) conditions.push(eq(items.itemType, type));
  if (georef === "yes" || georef === "true") {
    conditions.push(sql`${items.georefStatus} != 'none'`);
  } else if (georef) {
    conditions.push(eq(items.georefStatus, georef));
  }
  if (yearMin) conditions.push(sql`${items.yearStart} >= ${yearMin}`);
  if (yearMax) conditions.push(sql`${items.yearEnd} <= ${yearMax}`);
  if (hasVector) conditions.push(eq(items.hasVectorDerivative, true));

  const where = and(...conditions);

  const orderBy =
    sort === "year" ? asc(items.yearStart) :
    sort === "year_asc" ? asc(items.yearStart) :
    sort === "recent" ? desc(items.createdAt) :
    sort === "title_desc" ? desc(items.title) :
    asc(items.displayOrder);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        item: items,
        collection: { id: collections.id, slug: collections.slug, title: collections.title },
      })
      .from(items)
      .innerJoin(collections, eq(items.collectionId, collections.id))
      .where(where)
      .orderBy(asc(collections.title), orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(items).where(where),
  ]);

  const itemIds = rows.map((r) => r.item.id);
  const thumbnails = await db
    .select({ itemId: resources.itemId, url: resources.url })
    .from(resources)
    .where(and(inArray(resources.itemId, itemIds), eq(resources.resourceType, "thumbnail")));
  const thumbnailsByItemId = Object.fromEntries(thumbnails.map((t) => [t.itemId, t.url]));

  const resultsWithThumbnails = rows.map((r) => ({
    ...r,
    thumbnailUrl: thumbnailsByItemId[r.item.id] || null,
  }));

  return {
    results: resultsWithThumbnails,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function searchSuggest(q: string) {
  if (!q || q.length < 2) return [];
  const rows = await db
    .select({ title: items.title, slug: items.slug })
    .from(items)
    .where(and(eq(items.isPublished, true), ilike(items.title, `${q}%`)))
    .orderBy(asc(items.title))
    .limit(8);
  return rows;
}

export async function getFacets() {
  const [types, georefs, langs] = await Promise.all([
    db
      .select({ code: items.itemType, count: count() })
      .from(items)
      .where(eq(items.isPublished, true))
      .groupBy(items.itemType)
      .orderBy(desc(count())),
    db
      .select({ code: items.georefStatus, count: count() })
      .from(items)
      .where(eq(items.isPublished, true))
      .groupBy(items.georefStatus),
    db
      .select({ code: items.language, count: count() })
      .from(items)
      .where(and(eq(items.isPublished, true), sql`${items.language} is not null`))
      .groupBy(items.language),
  ]);
  return { types, georefs, langs };
}
