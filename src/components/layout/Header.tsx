"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapIcon, SearchIcon, BookOpenIcon, MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/collections", label: "Colecții" },
  { href: "/search", label: "Căutare" },
  { href: "/about", label: "Despre" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg">
          <MapIcon className="h-6 w-6" />
          <span className="hidden sm:inline">geo-spatial.org</span>
          <span className="text-muted-foreground font-normal hidden sm:inline">/</span>
          <span className="hidden sm:inline">Explorer</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                pathname?.startsWith(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin/ingest"
            className="ml-2 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Admin
          </Link>
        </nav>

        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname?.startsWith(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin/ingest"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground"
          >
            Admin
          </Link>
        </div>
      )}
    </header>
  );
}
