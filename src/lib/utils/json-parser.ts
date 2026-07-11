/**
 * Utility functions for parsing JSON data from CSV fields
 * Supports multiple encoding methods to avoid CSV parsing issues
 */

export function parseDownloadField(value: string | null | undefined): Array<{ format: string; title: string; link: string }> | null {
  if (!value || value.trim() === '') return null;

  // CSV escapes " as "" — fix that first
  let cleaned = value.replace(/""/g, '"');
  // Remove wrapping quotes if present
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(value);
    } catch {
      console.warn('Failed to parse download field:', value);
      return null;
    }
  }
}

export function parseInteractiveMapField(value: string | null | undefined): boolean {
  if (!value || value.trim() === '') return false;
  
  const normalized = value.toLowerCase().trim();
  return normalized === 'da' || normalized === 'yes' || normalized === 'true';
}
