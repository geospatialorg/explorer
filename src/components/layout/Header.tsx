"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/collections", label: "Colecții" },
  { href: "/search", label: "Căutare" },
  { href: "/about", label: "Despre" },
];

export function ExplorerLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <circle cx="50" cy="50" r="35" fill="none" stroke="#1E3448" strokeWidth="9" />
      <line x1="50" y1="20" x2="50" y2="80" stroke="#1E3448" strokeWidth="4" opacity="0.4" />
      <line x1="20" y1="50" x2="80" y2="50" stroke="#1E3448" strokeWidth="4" opacity="0.4" />
      <circle cx="61" cy="40" r="6" fill="#C2462E" />
      <line
        x1="76"
        y1="76"
        x2="104"
        y2="104"
        stroke="#C2462E"
        strokeWidth="13"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Use a slightly more compact header on the map viewer page (/collections/[slug]/[itemSlug])
  const isItemViewer =
    pathname?.startsWith("/collections/") && pathname.split("/").filter(Boolean).length >= 3;

  return (
    <header className="w-full border-b border-[#E1E5EA] bg-white">
      <div
        className={cn(
          "mx-auto flex flex-wrap items-center justify-between gap-3 px-6",
          isItemViewer ? "py-3" : "max-w-[1280px] py-4"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 text-[#1E3448] no-underline hover:opacity-90 transition-opacity",
            isItemViewer ? "text-[18px]" : "text-[20px]"
          )}
        >
          <ExplorerLogo size={isItemViewer ? 28 : 32} />
          <span className="tracking-tight">
            <span className="text-[#5B6B7A] font-normal">geo-spatial.org</span>
            <span className="text-[#C2462E] font-normal">/</span>
            <b className="font-bold text-[#1E3448]">Explorer</b>
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className={cn(
            "hidden md:flex flex-wrap items-center gap-1 font-medium",
            isItemViewer ? "text-[15px]" : "text-[16px]"
          )}
        >
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "px-3.5 py-2.5 rounded-[8px] no-underline transition-colors",
                  active
                    ? "bg-[#F3F4F6] text-[#1E3448] shadow-[inset_0_-2px_0_#C2462E]"
                    : "text-[#1E3448] hover:text-[#C2462E] hover:bg-[#F3F4F6]/60"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            aria-current={pathname?.startsWith("/admin") ? "page" : undefined}
            className={cn(
              "px-3.5 py-2.5 rounded-[8px] no-underline transition-colors",
              pathname?.startsWith("/admin")
                ? "bg-[#F3F4F6] text-[#1E3448] shadow-[inset_0_-2px_0_#C2462E]"
                : "text-[#5B6B7A] hover:text-[#C2462E]"
            )}
          >
            Admin
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden p-2 rounded-[8px] text-[#1E3448] hover:bg-[#F3F4F6]"
          onClick={() => setOpen(!open)}
          aria-label="Meniu navigare"
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#E1E5EA] bg-white px-6 py-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block px-3.5 py-2.5 rounded-[8px] text-[16px] font-medium no-underline transition-colors",
                  active
                    ? "bg-[#F3F4F6] text-[#1E3448] shadow-[inset_0_-2px_0_#C2462E]"
                    : "text-[#1E3448] hover:bg-[#F3F4F6]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 rounded-[8px] text-[16px] font-medium text-[#5B6B7A] hover:bg-[#F3F4F6]"
          >
            Admin
          </Link>
        </div>
      )}
    </header>
  );
}
