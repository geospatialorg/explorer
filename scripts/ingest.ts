#!/usr/bin/env tsx
import { config } from "dotenv";
config();
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseCollectionsCsv, parseItemsCsv } from "../src/lib/ingest/csv-parser";
import { ingestCollections, ingestItems } from "../src/lib/ingest/importer";

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === "collections") {
    const filePath = args[1] ?? process.env.CSV_COLLECTIONS_PATH;
    if (!filePath) {
      console.error("Usage: scripts/ingest.ts collections <path-to-csv>");
      process.exit(1);
    }
    console.log(`Reading collections from: ${resolve(filePath)}`);
    const csv = readFileSync(filePath, "utf8");
    const { rows, errors } = parseCollectionsCsv(csv);
    if (errors.length > 0) {
      console.warn("Parse warnings:", errors);
    }
    console.log(`Parsed ${rows.length} rows. Starting ingest…`);
    const result = await ingestCollections(rows);
    console.log(`Done. Inserted: ${result.inserted}, Updated: ${result.updated}`);
    if (result.errors.length > 0) {
      console.error("Errors:", result.errors);
    }
  } else if (cmd === "items") {
    const collectionSlug = args[1];
    const filePath = args[2] ?? process.env.CSV_ITEMS_PATH;
    if (!collectionSlug || !filePath) {
      console.error("Usage: scripts/ingest.ts items <collection-slug> <path-to-csv>");
      process.exit(1);
    }
    console.log(`Reading items from: ${resolve(filePath)}`);
    const csv = readFileSync(filePath, "utf8");
    const { rows, errors } = parseItemsCsv(csv);
    if (errors.length > 0) {
      console.warn("Parse warnings:", errors);
    }
    console.log(`Parsed ${rows.length} rows. Starting ingest into '${collectionSlug}'…`);
    const result = await ingestItems(rows, collectionSlug);
    console.log(`Done. Inserted: ${result.inserted}, Updated: ${result.updated}`);
    if (result.errors.length > 0) {
      console.error("Errors:", result.errors);
    }
  } else {
    console.log("Usage:");
    console.log("  npx tsx scripts/ingest.ts collections <path-to-csv>");
    console.log("  npx tsx scripts/ingest.ts items <collection-slug> <path-to-csv>");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
