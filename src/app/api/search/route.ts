import { NextRequest, NextResponse } from "next/server";
import { searchItems } from "@/lib/db/queries/search";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const collection = searchParams.get("collection") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const georef = searchParams.get("georef") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24", 10), 100);

  try {
    const result = await searchItems({ q, collection, type, georef, page, limit });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
