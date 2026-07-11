import Link from "next/link";
import Image from "next/image";
import { CalendarIcon, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeGeoref, BadgeItemType } from "@/components/shared/BadgeGeoref";
import { formatYear } from "@/lib/utils";
import { ITEM_TYPE_LABELS } from "@/lib/constants";
import type { Item } from "@/lib/db/schema";

interface Props {
  item: Item;
  collectionSlug: string;
  thumbnailUrl?: string;
}

export function ItemCard({ item, collectionSlug, thumbnailUrl }: Props) {
  return (
    <Link href={`/collections/${collectionSlug}/${item.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-border/60">
        <div className="aspect-[3/2] relative bg-muted overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <BadgeGeoref status={item.georefStatus} />
          </div>
        </div>
        <CardContent className="p-3 space-y-1.5">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1 italic">{item.subtitle}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <BadgeItemType type={ITEM_TYPE_LABELS[item.itemType] ?? item.itemType} className="text-xs" />
            {item.yearStart && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                {formatYear(item.yearStart, item.yearEnd)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
