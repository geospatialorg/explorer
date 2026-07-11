import { NextRequest, NextResponse } from "next/server";
import { getCollectionBySlug, getCollectionStats } from "@/lib/db/queries/collections";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const collection = await getCollectionBySlug(params.slug);
    if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const stats = await getCollectionStats(collection.id);
    return NextResponse.json({ collection, stats });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
