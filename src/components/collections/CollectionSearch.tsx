"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ItemCard } from "@/components/items/ItemCard";
import { SearchIcon, XIcon, LayersIcon } from "lucide-react";
import type { Item } from "@/lib/db/schema";

interface Props {
  items: Item[];
  collectionSlug: string;
  thumbnailsByItemId: Record<string, string>;
  total: number;
}

export function FilterableItemsGrid({ items, collectionSlug, thumbnailsByItemId, total }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [items, query]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">
          Items ({query ? `${filtered.length} / ${total}` : total})
        </h2>
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Filtrează items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Șterge filtrul"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <LayersIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{query ? "Niciun item nu corespunde filtrului" : "Niciun item găsit"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              collectionSlug={collectionSlug}
              thumbnailUrl={thumbnailsByItemId[item.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
