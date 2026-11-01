"use client";

import { useMemo, useState } from "react";
import { ItemCard } from "@/components/items/ItemCard";
import { ITEM_TYPE_LABELS } from "@/lib/constants";
import { XIcon } from "lucide-react";
import type { Item } from "@/lib/db/schema";

interface Props {
  items: Item[];
  collectionSlug: string;
  thumbnailsByItemId: Record<string, string>;
  total: number;
}

const ITEMS_PER_PAGE = 24;

export function FilterableItemsGrid({ items, collectionSlug, thumbnailsByItemId }: Props) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("all");
  const [onlyGeoref, setOnlyGeoref] = useState(false);
  const [page, setPage] = useState(1);

  const typeTabs = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const t = item.itemType || "other";
      counts[t] = (counts[t] || 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return [
      { code: "all", label: "Toate", count: items.length },
      ...entries.map(([code, count]) => ({
        code,
        label: ITEM_TYPE_LABELS[code] ?? code,
        count,
      })),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (activeType !== "all" && item.itemType !== activeType) return false;
      if (onlyGeoref && item.georefStatus === "none") return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSub = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesSub) return false;
      }
      return true;
    });
  }, [items, activeType, onlyGeoref, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <div>
      {/* Tabs & filter controls */}
      <section className="max-w-[1280px] mx-auto px-6 pt-8 flex flex-wrap justify-between items-center gap-4 border-b border-[#E1E5EA]">
        <div
          role="tablist"
          aria-label="Tip material"
          className="flex flex-wrap gap-1 -mb-px"
        >
          {typeTabs.map((t) => {
            const isActive = activeType === t.code;
            return (
              <button
                key={t.code}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveType(t.code);
                  setPage(1);
                }}
                className={`text-[15px] px-3.5 py-3 border-0 bg-transparent cursor-pointer transition-colors ${
                  isActive
                    ? "font-bold text-[#1E3448] shadow-[inset_0_-3px_0_#C2462E]"
                    : "font-normal text-[#3D4F60] hover:text-[#1E3448]"
                }`}
              >
                {t.label}{" "}
                <span className="font-mono text-[12px] text-[#5B6B7A] ml-1">
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 pb-3">
          <div className="relative">
            <input
              type="search"
              placeholder="Filtrează planșe…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="text-[14px] px-3 py-1.5 pr-7 border border-[#C9D1D9] rounded-[8px] text-[#1E3448] bg-white outline-none focus:border-[#1E3448]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6B7A] hover:text-[#1E3448]"
                aria-label="Șterge filtrul"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <label className="flex items-center gap-2.5 text-[15px] text-[#1E3448] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyGeoref}
              onChange={(e) => {
                setOnlyGeoref(e.target.checked);
                setPage(1);
              }}
              className="w-5 h-5 accent-[#C2462E] cursor-pointer"
            />
            Doar georeferențiate
          </label>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-[1280px] mx-auto px-6 pt-8 pb-16">
        {paginatedItems.length === 0 ? (
          <div className="py-16 text-center text-[#5B6B7A]">
            <p className="text-[17px] m-0">Nicio planșă nu corespunde filtrelor selectate.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-7">
              {paginatedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  collectionSlug={collectionSlug}
                  thumbnailUrl={thumbnailsByItemId[item.id]}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Paginare"
                className="flex flex-wrap justify-center gap-1.5 mt-12 text-[15px]"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPage(p);
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }}
                    aria-current={p === currentPage ? "page" : undefined}
                    className={`min-w-[44px] h-[44px] flex items-center justify-center rounded-[8px] cursor-pointer transition-colors ${
                      p === currentPage
                        ? "bg-[#1E3448] text-white font-medium border-0"
                        : "bg-white border border-[#E1E5EA] text-[#1E3448] hover:border-[#1E3448]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
