"use client";

interface Props {
  current: string;
  collections: { id: string; title: string }[];
  preserveParams?: Record<string, string>;
}

export function CollectionSelect({ current, collections, preserveParams = {} }: Props) {
  function navigate(value: string) {
    const p = new URLSearchParams({ ...preserveParams, collectionId: value, page: "1" });
    if (!value) p.delete("collectionId");
    window.location.href = `${window.location.pathname}?${p}`;
  }

  return (
    <select
      defaultValue={current}
      onChange={(e) => navigate(e.target.value)}
      className="border rounded-md text-sm px-2 h-8 max-w-[220px]"
    >
      <option value="">Toate colecțiile</option>
      {collections.map((c) => (
        <option key={c.id} value={c.id}>{c.title}</option>
      ))}
    </select>
  );
}
