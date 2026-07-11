import { NextRequest, NextResponse } from "next/server";
import { getCollections, getSiteStats } from "@/lib/db/queries/collections";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const sort = searchParams.get("sort") ?? "title";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24", 10), 100);

  try {
    const result = await getCollections({ q, type, sort, page, limit, publishedOnly: true });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
