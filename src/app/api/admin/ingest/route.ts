import { NextRequest, NextResponse } from "next/server";
import { parseCollectionsCsv, parseItemsCsv } from "@/lib/ingest/csv-parser";
import { ingestCollections, ingestItems } from "@/lib/ingest/importer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mode = formData.get("mode") as string;
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Niciun fișier furnizat" }, { status: 400 });
    }

    const csvText = await file.text();

    if (mode === "collections") {
      const { rows, errors: parseErrors } = parseCollectionsCsv(csvText);
      if (rows.length === 0 && parseErrors.length > 0) {
        return NextResponse.json({ error: "CSV invalid", details: parseErrors }, { status: 400 });
      }
      const result = await ingestCollections(rows);
      return NextResponse.json({ collections: result });
    }

    if (mode === "items") {
      const collectionSlug = formData.get("collectionSlug") as string;
      if (!collectionSlug) {
        return NextResponse.json({ error: "collectionSlug necesar pentru items" }, { status: 400 });
      }
      const { rows, errors: parseErrors } = parseItemsCsv(csvText);
      if (rows.length === 0 && parseErrors.length > 0) {
        return NextResponse.json({ error: "CSV invalid", details: parseErrors }, { status: 400 });
      }
      const result = await ingestItems(rows, collectionSlug);
      return NextResponse.json({ items: result });
    }

    return NextResponse.json({ error: "mode necunoscut" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
