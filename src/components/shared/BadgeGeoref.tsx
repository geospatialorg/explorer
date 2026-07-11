import { Badge } from "@/components/ui/badge";
import { GEOREF_LABELS, GEOREF_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props { status: string; className?: string }

export function BadgeGeoref({ status, className }: Props) {
  const label = GEOREF_LABELS[status] ?? status;
  const color = GEOREF_COLORS[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border-0", color, className)}>
      {label}
    </span>
  );
}

export function BadgeItemType({ type, className }: { type: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      {type}
    </Badge>
  );
}
