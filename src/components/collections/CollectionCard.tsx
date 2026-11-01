import Link from "next/link";
import Image from "next/image";
import { formatYear } from "@/lib/utils";
import type { Collection } from "@/lib/db/schema";

interface Props {
  collection: Collection;
  itemCount?: number;
  georefCount?: number;
}

function encodeThumbnailUrl(url: string) {
  if (!url.startsWith("http")) return url;
  return url
    .split("/")
    .map((s, i) => (i < 3 ? s : encodeURIComponent(s)))
    .join("/");
}

export function CollectionCard({ collection, itemCount = 0, georefCount = 0 }: Props) {
  const pct = itemCount > 0 ? Math.min(100, Math.round((georefCount / itemCount) * 100)) : 0;
  const period = formatYear(collection.yearStart, collection.yearEnd);

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group flex flex-wrap no-underline text-[#1E3448] border border-[#E1E5EA] hover:border-[#C9D1D9] transition-colors rounded-[16px] overflow-hidden bg-white"
    >
      <div className="flex-[1_1_320px] min-h-[260px] aspect-[4/3] relative bg-[#EEF0F3] flex items-center justify-center font-mono text-[13px] text-[#5B6B7A] overflow-hidden">
        {collection.thumbnailPath ? (
          <Image
            src={encodeThumbnailUrl(collection.thumbnailPath)}
            alt={collection.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <span>[Copertă / mozaic planșe]</span>
        )}
      </div>

      <div className="flex-[999_1_520px] p-7 md:px-10 md:py-9 flex flex-col gap-3.5 justify-center">
        <div className="flex flex-wrap gap-3 font-mono text-[13px] text-[#5B6B7A]">
          {collection.type && <span className="uppercase">{collection.type}</span>}
          {period && <span>{period}</span>}
          {(collection.institution || collection.author) && (
            <span>{collection.institution || collection.author}</span>
          )}
        </div>

        <h2 className="m-0 text-[26px] md:text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1E3448] group-hover:text-[#C2462E] transition-colors">
          {collection.title}
        </h2>

        {collection.description && (
          <p className="m-0 text-[16px] leading-[1.55] text-[#3D4F60] line-clamp-3">
            {collection.description}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-1.5">
          <div className="flex justify-between text-[14px]">
            <span>
              {itemCount.toLocaleString()} {collection.itemType || "planșe"}
            </span>
            <span className="text-[#8F2F1E] font-medium">
              {georefCount.toLocaleString()} georeferențiate
            </span>
          </div>
          <div
            role="img"
            aria-label={`${pct}% din planșe georeferențiate`}
            className="h-2 rounded-[4px] bg-[#E1E5EA] overflow-hidden"
          >
            <div
              className="h-2 bg-[#C2462E] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
