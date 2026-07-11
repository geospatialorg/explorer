import { db } from "@/lib/db";
import { collections, items, resources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import slugify from "slugify";
import { CollectionRow, ItemRow, parseKeywords, parseYear, parseExternalLinks } from "./csv-parser";
import { parseDownloadField, parseInteractiveMapField } from "@/lib/utils/json-parser";

function parseGeorefStatus(raw: string): string {
  const v = raw?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "accurate" || v === "yes" || v === "da" || v === "georef" || v === "georeferentiat" || v === "georeferençiat") return "accurate";
  if (v === "approximate" || v === "2" || v === "aproximativ") return "approximate";
  if (v === "precise" || v === "3" || v === "precis") return "precise";
  return "none";
}

export interface IngestResult {
  collections: { inserted: number; updated: number; errors: string[] };
  items: { inserted: number; updated: number; errors: string[] };
}

export async function ingestCollections(
  rows: CollectionRow[],
  collectionUuid?: string
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const slug = slugify(row.title);
      const year = parseYear(row.year);
      const externalLinks = parseExternalLinks(row.catalog_link);
      const tags = parseKeywords(row.keywords);

      const existingById = row.uuid
        ? await db.query.collections.findFirst({ where: eq(collections.id, row.uuid) })
        : null;
      const existingBySlug = await db.query.collections.findFirst({ where: eq(collections.slug, slug) });
      const existing = existingById ?? existingBySlug;

      const data = {
        slug: existing?.slug ?? slug,
        title: row.title,
        description: row.description || null,
        tags,
        thumbnailPath: row.thumbnail_path || null,
        type: row.type || null,
        itemType: row.item_type || null,
        download: (() => {
          const parsed = parseDownloadField(row.download);
          if (row.download) console.log(`[DOWNLOAD DEBUG] raw="${row.download}" parsed=`, JSON.stringify(parsed));
          return parsed;
        })(),
        interactiveMap: parseInteractiveMapField(row.interactive_map) ? 'Da' : null,
        author: row.author || null,
        institution: row.institution || null,
        license: row.license || null,
        language: row.language || null,
        yearStart: year,
        yearEnd: year,
        externalLinks: externalLinks.length ? externalLinks : null,
        isPublished: true,
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(collections).set(data).where(eq(collections.id, existing.id));
        updated++;
      } else {
        const idToUse = row.uuid || undefined;
        await db.insert(collections).values({ id: idToUse, ...data });
        inserted++;
      }
    } catch (err) {
      errors.push(`Row "${row.title}": ${(err as Error).message}`);
    }
  }

  return { inserted, updated, errors };
}

export async function ingestItems(
  rows: ItemRow[],
  collectionSlug: string
): Promise<{ inserted: number; updated: number; errors: string[]; insertedItems: string[]; updatedItems: string[] }> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];
  const insertedItems: string[] = [];
  const updatedItems: string[] = [];
  console.log(`[DEBUG] ingestItems: Starting import for collection '${collectionSlug}' with ${rows.length} rows`);

  const collection = await db.query.collections.findFirst({
    where: eq(collections.slug, collectionSlug),
  });

  if (!collection) {
    return { inserted: 0, updated: 0, errors: [`Collection not found: ${collectionSlug}`], insertedItems: [], updatedItems: [] };
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    console.log(`[DEBUG] Processing row ${i + 1}/${rows.length}: "${row.title}" (id: ${row.id || 'null'}, uuid: ${row.uuid || 'null'})`);
    try {
      let slug = slugify(row.title);
      const year = parseYear(row.year);
      const keywords = parseKeywords(row.keywords);
      const georefStatus = parseGeorefStatus(row.spatial);

      const existingById = row.uuid
        ? await db.query.items.findFirst({ where: eq(items.id, row.uuid) })
        : null;
      
      // Generate unique slug: include UUID if available, otherwise check for duplicates
      let itemSlug: string;
      if (row.uuid) {
        itemSlug = `${collectionSlug}-${slug}-${row.uuid.slice(-8)}`;  // Use last 8 chars of UUID
      } else {
        // Check for existing items with same slug and append suffix if needed
        let suffix = 1;
        let baseSlug = slug;
        while (true) {
          const testSlug = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
          const existingBySlug = await db.query.items.findFirst({
            where: eq(items.slug, `${collectionSlug}-${testSlug}`),
          });
          if (!existingBySlug || (existingById && existingBySlug.id === existingById.id)) {
            itemSlug = `${collectionSlug}-${testSlug}`;
            break;
          }
          suffix++;
        }
      }
      
      const existing = existingById;  // Only use UUID for existing detection

      const displayOrder = row.id?.trim() ? parseInt(row.id.trim(), 10) : null;
      const imageSizeX = row.size_x?.trim() ? parseInt(row.size_x.trim(), 10) : null;
      const imageSizeY = row.size_y?.trim() ? parseInt(row.size_y.trim(), 10) : null;

      const data = {
        collectionId: collection.id,
        slug: itemSlug,
        itemType: row.type || "other",
        title: row.title,
        subtitle: row.subtitle || null,
        yearStart: year,
        yearEnd: year,
        language: row.language || null,
        notes: row.notes || null,
        keywords,
        georefStatus,
        displayOrder: isNaN(displayOrder as number) ? null : displayOrder,
        imageSizeX: isNaN(imageSizeX as number) ? null : imageSizeX,
        imageSizeY: isNaN(imageSizeY as number) ? null : imageSizeY,
        validationStatus: "published" as const,
        isPublished: true,
        updatedAt: new Date(),
      };

      let itemId: string;

      if (existing) {
        await db.update(items).set(data).where(eq(items.id, existing.id));
        await db.delete(resources).where(eq(resources.itemId, existing.id));
        itemId = existing.id;
        updated++;
        updatedItems.push(row.title);
      } else {
        const insertedItem = await db.insert(items).values(data).returning({ id: items.id });
        itemId = insertedItem[0].id;
        inserted++;
        insertedItems.push(row.title);
      }

      const resourcesToInsert = [];

      if (row.cog_path?.trim()) {
        resourcesToInsert.push({
          itemId,
          resourceType: "cog",
          role: "view",
          url: row.cog_path.trim(),
          protocol: "HTTP",
          format: "COG",
          mimeType: "image/tiff",
          isPrimary: true,
        });
      }

      if (row.layer_name_scan?.trim() && row.wms_path?.trim()) {
        resourcesToInsert.push({
          itemId,
          resourceType: "wms_scan",
          role: "view",
          url: row.wms_path.trim(),
          protocol: "OGC:WMS",
          layerName: row.layer_name_scan.trim(),
          isPrimary: false,
        });
      }

      if (row.wms_path?.trim() && row.layer_name?.trim()) {
        resourcesToInsert.push({
          itemId,
          resourceType: "wms",
          role: "view",
          url: row.wms_path.trim(),
          protocol: "OGC:WMS",
          layerName: row.layer_name.trim(),
          isPrimary: false,
        });
      }

      if (row.thumbnail_path?.trim()) {
        resourcesToInsert.push({
          itemId,
          resourceType: "thumbnail",
          role: "thumbnail",
          url: row.thumbnail_path.trim(),
          protocol: "HTTP",
          isPrimary: false,
        });
      }

      if (resourcesToInsert.length) {
        await db.insert(resources).values(resourcesToInsert);
      }
    } catch (err) {
      const errorMsg = `Row ${i + 1} "${row.title}": ${(err as Error).message}`;
      console.error(`[DEBUG] ERROR: ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  console.log(`[DEBUG] ingestItems: Completed - inserted: ${inserted}, updated: ${updated}, errors: ${errors.length}`);
  console.log(`[DEBUG] Inserted items:`, insertedItems);
  console.log(`[DEBUG] Updated items:`, updatedItems);
  if (errors.length > 0) {
    console.log(`[DEBUG] First 5 errors:`, errors.slice(0, 5));
  }
  return { inserted, updated, errors, insertedItems, updatedItems };
}
