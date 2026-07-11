import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const row = await db.query.items.findFirst({ where: eq(items.id, params.id) });
  if (!row) return NextResponse.json({ error: "Negăsit" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const {
    title, subtitle, description, notes, itemType, georefStatus,
    yearStart, yearEnd, language, keywords, scale, projectionCrs,
    author, institution, license, isPublished, validationStatus,
  } = body;

  const keywordsArr = Array.isArray(keywords)
    ? keywords
    : typeof keywords === "string"
    ? keywords.split(/[,|;]+/).map((k: string) => k.trim()).filter(Boolean)
    : [];

  const [updated] = await db
    .update(items)
    .set({
      title,
      subtitle: subtitle || null,
      description: description || null,
      notes: notes || null,
      itemType: itemType || "other",
      georefStatus: georefStatus || "none",
      yearStart: yearStart ? parseInt(yearStart, 10) : null,
      yearEnd: yearEnd ? parseInt(yearEnd, 10) : null,
      language: language || null,
      keywords: keywordsArr,
      scale: scale || null,
      projectionCrs: projectionCrs || null,
      author: author || null,
      institution: institution || null,
      license: license || null,
      isPublished: Boolean(isPublished),
      validationStatus: validationStatus || "draft",
      updatedAt: new Date(),
    })
    .where(eq(items.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Negăsit" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  await db.delete(items).where(eq(items.id, params.id));
  return NextResponse.json({ ok: true });
}
