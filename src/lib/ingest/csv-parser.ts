import { parse } from "csv-parse/sync";

export interface CollectionRow {
  uuid: string;
  title: string;
  description: string;
  keywords: string;
  thumbnail_path: string;
  type: string;
  author: string;
  institution: string;
  license: string;
  year: string;
  language: string;
  catalog_link: string;
}

export interface ItemRow {
  uuid: string;
  type: string;
  spatial: string;
  title: string;
  subtitle: string;
  year: string;
  language: string;
  keywords: string;
  notes: string;
  layer_name: string;
  cog_path: string;
  wms_path: string;
  thumbnail_path: string;
  collection_uuid?: string;
  collection_slug?: string;
}

export interface ParseResult<T> {
  rows: T[];
  errors: Array<{ row: number; message: string }>;
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
