import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYear(start?: number | null, end?: number | null): string {
  if (!start) return "—";
  if (!end || end === start) return String(start);
  return `${start}–${end}`;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  const mb = bytes / 1_000_000;
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  const kb = bytes / 1_000;
  return `${kb.toFixed(0)} KB`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
