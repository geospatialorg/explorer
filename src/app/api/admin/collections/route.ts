import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { ilike, and, eq, asc, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") ?? "title";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 25;
  const offset = (page - 1) * limit;

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

  return NextResponse.json({ collections: rows, total, pages: Math.ceil(total / limit), page });
}
