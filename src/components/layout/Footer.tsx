import Link from "next/link";
import { MapIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">geo-spatial.org Explorer</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/collections" className="hover:text-foreground transition-colors">Colecții</Link>
            <Link href="/search" className="hover:text-foreground transition-colors">Căutare</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">Despre</Link>
            <Link href="/admin/ingest" className="hover:text-foreground transition-colors">Admin</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} geo-spatial.org
          </p>
        </div>
      </div>
    </footer>
  );
}
