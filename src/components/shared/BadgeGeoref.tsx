import { GEOREF_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  status: string;
  variant?: "overlay" | "inline";
  className?: string;
}

export function BadgeGeoref({ status, variant = "inline", className }: Props) {
  const isGeoref = status !== "none";
  const label = GEOREF_LABELS[status] ?? status;

  if (variant === "overlay") {
    if (!isGeoref) return null;
    return (
      <span
        className={cn(
          "inline-block bg-[#C2462E] text-white font-mono text-[11px] font-medium px-2 py-1 rounded-[4px] tracking-[0.04em] uppercase",
          className
        )}
      >
        GEOREF
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-2 py-1 text-[12px] font-medium",
        isGeoref
          ? "bg-[#FBEAE6] text-[#8F2F1E]"
          : "bg-[#F3F4F6] text-[#5B6B7A]",
        className
      )}
    >
      {label}
    </span>
  );
}

export function BadgeItemType({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] bg-[#F3F4F6] text-[#1E3448] px-2 py-1 text-[12px] font-medium",
        className
      )}
    >
      {type}
    </span>
  );
}
