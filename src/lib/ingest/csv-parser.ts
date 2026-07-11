import { parse } from "csv-parse/sync";

export interface CollectionRow {
  uuid: string;
  title: string;
  description: string;
  keywords: string;
  thumbnail_path: string;
  type: string;
  item_type: string;
  download: string;
  interactive_map: string;
  author: string;
  institution: string;
  license: string;
  year: string;
  language: string;
  catalog_link: string;
}

export interface ItemRow {
  id: string;
  uuid: string;
  title: string;
  subtitle: string;
  type: string;
  spatial: string;
  year: string;
  language: string;
  keywords: string;
  notes: string;
  author: string;
  institution: string;
  license: string;
  scale: string;
  projection_crs: string;
  size_x: string;
  size_y: string;
  wms_path: string;
  layer_name: string;
  layer_name_scan: string;
  cog_path: string;
  thumbnail_path: string;
  collection_uuid?: string;
  collection_slug?: string;
}

export interface ParseResult<T> {
  rows: T[];
  errors: Array<{ row: number; message: string }>;
}

export function parseKeywords(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/[;,|]+/).map((k) => k.trim()).filter(Boolean);
}

export function parseYear(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export function parseExternalLinks(raw: string): Array<{ label: string; url: string }> {
  if (!raw?.trim()) return [];
  return raw.split(";").map((part) => {
    const eqIdx = part.indexOf("=");
    if (eqIdx > -1) {
      const label = part.slice(0, eqIdx).trim();
      const url = part.slice(eqIdx + 1).trim();
      return { label, url };
    }
    return null;
  }).filter(Boolean) as Array<{ label: string; url: string }>;
}

export function parseCollectionsCsv(content: string): ParseResult<CollectionRow> {
  const errors: Array<{ row: number; message: string }> = [];
  let records: CollectionRow[] = [];

  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as CollectionRow[];
  } catch (err) {
    errors.push({ row: 0, message: `Parse error: ${(err as Error).message}` });
    return { rows: [], errors };
  }

  const validated: CollectionRow[] = [];
  records.forEach((row, i) => {
    const rowNum = i + 2;
    if (!row.title?.trim()) {
      errors.push({ row: rowNum, message: "Missing required field: title" });
      return;
    }
    validated.push(row);
  });

  return { rows: validated, errors };
}

export function parseItemsCsv(content: string): ParseResult<ItemRow> {
  const errors: Array<{ row: number; message: string }> = [];
  let records: ItemRow[] = [];

  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as ItemRow[];
  } catch (err) {
    errors.push({ row: 0, message: `Parse error: ${(err as Error).message}` });
    return { rows: [], errors };
  }

  const validated: ItemRow[] = [];
  records.forEach((row, i) => {
    const rowNum = i + 2;
    if (!row.title?.trim()) {
      errors.push({ row: rowNum, message: "Missing required field: title" });
      return;
    }
    validated.push(row);
  });

  return { rows: validated, errors };
}
