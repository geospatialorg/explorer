import { NextRequest, NextResponse } from "next/server";
import { getItemWithResources } from "@/lib/db/queries/items";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const data = await getItemWithResources(params.slug);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
