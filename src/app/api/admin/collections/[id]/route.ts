import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const row = await db.query.collections.findFirst({ where: eq(collections.id, params.id) });
  if (!row) return NextResponse.json({ error: "Negăsit" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const {
    title, description, type, author, institution, license, language,
    yearStart, yearEnd, thumbnailPath, tags, isPublished,
  } = body;

  const tagsArr = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
    ? tags.split(/[,|;]+/).map((t: string) => t.trim()).filter(Boolean)
    : [];

  const [updated] = await db
    .update(collections)
    .set({
      title,
      description: description || null,
      type: type || null,
      author: author || null,
      institution: institution || null,
      license: license || null,
      language: language || null,
      yearStart: yearStart ? parseInt(yearStart, 10) : null,
      yearEnd: yearEnd ? parseInt(yearEnd, 10) : null,
      thumbnailPath: thumbnailPath || null,
      tags: tagsArr,
      isPublished: Boolean(isPublished),
      updatedAt: new Date(),
    })
    .where(eq(collections.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Negăsit" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  await db.delete(collections).where(eq(collections.id, params.id));
  return NextResponse.json({ ok: true });
}
