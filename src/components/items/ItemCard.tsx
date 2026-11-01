import Link from "next/link";
import Image from "next/image";
import { BadgeGeoref } from "@/components/shared/BadgeGeoref";
import { formatYear } from "@/lib/utils";
import { ITEM_TYPE_LABELS } from "@/lib/constants";
import type { Item } from "@/lib/db/schema";

interface Props {
  item: Item;
  collectionSlug: string;
  thumbnailUrl?: string;
}

function encodeThumbnailUrl(url: string) {
  if (!url.startsWith("http")) return url;
  return url
    .split("/")
    .map((s, i) => (i < 3 ? s : encodeURIComponent(s)))
    .join("/");
}

export function ItemCard({ item, collectionSlug, thumbnailUrl }: Props) {
  const typeLabel = (ITEM_TYPE_LABELS[item.itemType] ?? item.itemType).toUpperCase();
  const period = formatYear(item.yearStart, item.yearEnd);

  return (
    <Link
      href={`/collections/${collectionSlug}/${item.slug}`}
      className="group no-underline text-[#1E3448] flex flex-col gap-2.5"
    >
      <div className="aspect-[3/4] bg-[#EEF0F3] rounded-[10px] relative overflow-hidden flex items-center justify-center font-mono text-[12px] text-[#5B6B7A]">
        {thumbnailUrl ? (
          <Image
            src={encodeThumbnailUrl(thumbnailUrl)}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <span>[Miniatură]</span>
        )}
        <div className="absolute top-2.5 left-2.5">
          <BadgeGeoref status={item.georefStatus} variant="overlay" />
        </div>
      </div>

      <div className="flex gap-2 font-mono text-[12px] text-[#5B6B7A]">
        <span>{typeLabel}</span>
        {period && (
          <>
            <span>·</span>
            <span>{period}</span>
          </>
        )}
      </div>

      <span className="text-[16px] font-medium leading-[1.35] text-[#1E3448] group-hover:text-[#C2462E] transition-colors line-clamp-2">
        {item.title}
      </span>
    </Link>
  );
}
