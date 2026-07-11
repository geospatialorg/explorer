import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, LayersIcon, CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatYear } from "@/lib/utils";
import type { Collection } from "@/lib/db/schema";

interface Props {
  collection: Collection;
  itemCount?: number;
  georefCount?: number;
}

export function CollectionCard({ collection, itemCount = 0, georefCount = 0 }: Props) {
  return (
    <Link href={`/collections/${collection.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-border/60">
        <div className="aspect-[4/3] relative bg-muted overflow-hidden">
          {collection.thumbnailPath ? (
            <Image
              src={collection.thumbnailPath.startsWith("http") ? collection.thumbnailPath.split("/").map((s, i) => i < 3 ? s : encodeURIComponent(s)).join("/") : collection.thumbnailPath}
              alt={collection.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <MapPinIcon className="h-12 w-12 text-primary/30" />
            </div>
          )}
          {collection.type && (
            <Badge className="absolute top-2 left-2 bg-white/90 text-foreground hover:bg-white/90 text-xs">
              {collection.type}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{collection.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {(collection.yearStart || collection.yearEnd) && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {formatYear(collection.yearStart, collection.yearEnd)}
              </span>
            )}
            {itemCount > 0 && (
              <span className="flex items-center gap-1">
                <LayersIcon className="h-3 w-3" />
                {itemCount} {collection.itemType || 'items'}
              </span>
            )}
            {georefCount > 0 && (
              <span className="text-blue-600 font-medium">{georefCount} georef.</span>
            )}
          </div>
          {collection.institution && (
            <p className="text-xs text-muted-foreground truncate">{collection.institution}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
