import { db } from "@/lib/db";
import { items, resources, collections } from "@/lib/db/schema";
import { eq, ilike, and, sql, desc, asc, count, inArray } from "drizzle-orm";

export async function getItems(opts?: {
  collectionId?: string;
  collectionSlug?: string;
  q?: string;
  type?: string;
  georef?: string;
  page?: number;
  limit?: number;
  sort?: string;
  publishedOnly?: boolean;
}) {
  const {
    collectionId, collectionSlug, q, type, georef,
    page = 1, limit = 24, sort = "title", publishedOnly = true,
  } = opts ?? {};
  const offset = (page - 1) * limit;

  const conditions = [];
  if (publishedOnly) conditions.push(eq(items.isPublished, true));
  if (collectionId) conditions.push(eq(items.collectionId, collectionId));
  if (collectionSlug) {
    const coll = await db.query.collections.findFirst({ where: eq(collections.slug, collectionSlug) });
    if (coll) conditions.push(eq(items.collectionId, coll.id));
    else return { items: [], total: 0, page, limit, pages: 0 };
  }
  if (q) conditions.push(ilike(items.title, `%${q}%`));
  if (type) conditions.push(eq(items.itemType, type));
  if (georef) conditions.push(eq(items.georefStatus, georef));

  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    sort === "year" ? desc(items.yearStart) :
    sort === "year_asc" ? asc(items.yearStart) :
    sort === "recent" ? desc(items.createdAt) :
    sort === "title_desc" ? desc(items.title) :
    asc(items.title);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(items).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: count() }).from(items).where(where),
  ]);

  return { items: rows, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getItemBySlug(slug: string) {
  return db.query.items.findFirst({ where: eq(items.slug, slug) });
}

export async function getItemWithResources(slug: string) {
  const item = await db.query.items.findFirst({ where: eq(items.slug, slug) });
  if (!item) return null;
  const itemResources = await db.select().from(resources).where(eq(resources.itemId, item.id));
  const collection = await db.query.collections.findFirst({ where: eq(collections.id, item.collectionId) });
  return { ...item, resources: itemResources, collection };
}

export async function getItemTypeDistribution(collectionId: string) {
  return db
    .select({ type: items.itemType, count: count() })
    .from(items)
    .where(and(eq(items.collectionId, collectionId), eq(items.isPublished, true)))
    .groupBy(items.itemType);
}

export async function getResourcesByItemId(itemId: string) {
  return db.select().from(resources).where(eq(resources.itemId, itemId));
}
