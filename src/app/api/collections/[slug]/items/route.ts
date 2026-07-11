import { NextRequest, NextResponse } from "next/server";
import { getCollectionBySlug } from "@/lib/db/queries/collections";
import { getItems } from "@/lib/db/queries/items";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24", 10), 100);
  const q = searchParams.get("q") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const sort = searchParams.get("sort") ?? "title";

  try {
    const collection = await getCollectionBySlug(params.slug);
    if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await getItems({ collectionId: collection.id, q, type, sort, page, limit, publishedOnly: true });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
