const TRANSLITERATION: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ț: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ț: "t",
  ä: "a", ö: "o", ü: "u", ß: "ss",
  é: "e", è: "e", ê: "e", ë: "e",
  á: "a", à: "a", ã: "a",
  í: "i", ì: "i", ï: "i",
  ó: "o", ò: "o", õ: "o",
  ú: "u", ù: "u",
  ç: "c", ñ: "n",
};

export function slugify(text: string): string {
  return text
    .split("")
    .map((c) => TRANSLITERATION[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function makeUniqueSlug(base: string, existing: Set<string>): string {
  let slug = slugify(base);
  if (!existing.has(slug)) return slug;
  let i = 2;
  while (existing.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}
