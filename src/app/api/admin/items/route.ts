import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { items, collections } from "@/lib/db/schema";
import { ilike, and, eq, asc, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const collectionId = searchParams.get("collectionId") ?? undefined;
  const sort = searchParams.get("sort") ?? "title";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (q) conditions.push(ilike(items.title, `%${q}%`));
  if (collectionId) conditions.push(eq(items.collectionId, collectionId));
  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    sort === "recent" ? desc(items.createdAt) :
    sort === "title_desc" ? desc(items.title) :
    sort === "year" ? desc(items.yearStart) :
    asc(items.title);

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: items.id, slug: items.slug, title: items.title, itemType: items.itemType,
      yearStart: items.yearStart, georefStatus: items.georefStatus,
      isPublished: items.isPublished, validationStatus: items.validationStatus,
      collectionId: items.collectionId, createdAt: items.createdAt,
    }).from(items).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: count() }).from(items).where(where),
  ]);

  return NextResponse.json({ items: rows, total, pages: Math.ceil(total / limit), page });
}
