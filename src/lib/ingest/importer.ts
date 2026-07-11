import { db } from "@/lib/db";
import { collections, items, resources } from "@/lib/db/schema";
import { slugify } from "@/lib/slugify";
import { eq } from "drizzle-orm";
import type { CollectionRow, ItemRow } from "./csv-parser";

function parseKeywords(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/[;,]+/).map((k) => k.trim()).filter(Boolean);
}

function parseYear(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

function parseGeorefStatus(raw: string): string {
  const v = raw?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "accurate") return "accurate";
  if (v === "approximate" || v === "2") return "approximate";
  if (v === "precise" || v === "3") return "precise";
  return "none";
}

function parseExternalLinks(raw: string): Array<{ label: string; url: string }> {
  if (!raw?.trim()) return [];
  return raw.split(";").map((part) => {
    const eqIdx = part.indexOf("=");
    if (eqIdx > -1) {
      return { label: part.slice(0, eqIdx).trim(), url: part.slice(eqIdx + 1).trim() };
    }
    return { label: "Link", url: part.trim() };
  }).filter((l) => l.url);
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
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  const collection = await db.query.collections.findFirst({
    where: eq(collections.slug, collectionSlug),
  });

  if (!collection) {
    return { inserted: 0, updated: 0, errors: [`Collection not found: ${collectionSlug}`] };
  }

  for (const row of rows) {
    try {
      const slug = slugify(row.title);
      const year = parseYear(row.year);
      const keywords = parseKeywords(row.keywords);
      const georefStatus = parseGeorefStatus(row.spatial);

      const existingById = row.uuid
        ? await db.query.items.findFirst({ where: eq(items.id, row.uuid) })
        : null;
      const existingBySlug = await db.query.items.findFirst({
        where: eq(items.slug, `${collectionSlug}-${slug}`),
      });
      const existing = existingById ?? existingBySlug;

      const itemSlug = existing?.slug ?? `${collectionSlug}-${slug}`;

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
      } else {
        const idToUse = row.uuid || undefined;
        const [inserted_item] = await db.insert(items).values({ id: idToUse, ...data }).returning({ id: items.id });
        itemId = inserted_item.id;
        inserted++;
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

      if (row.wms_path?.trim()) {
        resourcesToInsert.push({
          itemId,
          resourceType: "wms",
          role: "view",
          url: row.wms_path.trim(),
          protocol: "OGC:WMS",
          layerName: row.layer_name?.trim() || null,
          isPrimary: !row.cog_path?.trim(),
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
      errors.push(`Row "${row.title}": ${(err as Error).message}`);
    }
  }

  return { inserted, updated, errors };
}
