import { db } from "@/lib/db";
import { collections, items } from "@/lib/db/schema";
import { eq, ilike, and, sql, desc, asc, count } from "drizzle-orm";

export async function getCollections(opts?: {
  q?: string;
  type?: string;
  page?: number;
  limit?: number;
  sort?: string;
  publishedOnly?: boolean;
}) {
  const { q, type, page = 1, limit = 24, sort = "title", publishedOnly = true } = opts ?? {};
  const offset = (page - 1) * limit;

  const conditions = [];
  if (publishedOnly) conditions.push(eq(collections.isPublished, true));
  if (q) conditions.push(ilike(collections.title, `%${q}%`));
  if (type) conditions.push(eq(collections.type, type));

  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    sort === "year" ? desc(collections.yearStart) :
    sort === "year_asc" ? asc(collections.yearStart) :
    sort === "recent" ? desc(collections.createdAt) :
    sort === "title_desc" ? desc(collections.title) :
    asc(collections.title);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(collections).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: count() }).from(collections).where(where),
  ]);

  return { collections: rows, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getCollectionBySlug(slug: string) {
  return db.query.collections.findFirst({
    where: eq(collections.slug, slug),
  });
}

export async function getCollectionStats(collectionId: string) {
  const result = await db
    .select({
      total: count(),
      georef: sql<number>`count(*) filter (where ${items.georefStatus} != 'none')`,
      published: sql<number>`count(*) filter (where ${items.isPublished} = true)`,
    })
    .from(items)
    .where(eq(items.collectionId, collectionId));

  return result[0] ?? { total: 0, georef: 0, published: 0 };
}

export async function getAllCollectionStats() {
  return db
    .select({
      collectionId: items.collectionId,
      total: count(),
      georef: sql<number>`count(*) filter (where ${items.georefStatus} != 'none')`,
    })
    .from(items)
    .where(eq(items.isPublished, true))
    .groupBy(items.collectionId);
}

export async function getSiteStats() {
  const [collCount] = await db
    .select({ total: count() })
    .from(collections)
    .where(eq(collections.isPublished, true));
  const [itemCount] = await db
    .select({
      total: count(),
      georef: sql<number>`count(*) filter (where ${items.georefStatus} != 'none')`,
    })
    .from(items)
    .where(eq(items.isPublished, true));

  return {
    collections: collCount?.total ?? 0,
    items: itemCount?.total ?? 0,
    georeferenced: itemCount?.georef ?? 0,
  };
}
