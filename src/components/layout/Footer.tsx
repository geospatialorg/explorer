import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#E1E5EA] bg-white mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-[14px] text-[#5B6B7A]">
        <span>© {new Date().getFullYear()} geo-spatial.org</span>
        <div className="flex flex-wrap items-center gap-5">
          <a
            href="https://geo-spatial.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1E3448] hover:text-[#C2462E] transition-colors no-underline"
          >
            geo-spatial.org
          </a>
          <a
            href="https://github.com/geospatialorg/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1E3448] hover:text-[#C2462E] transition-colors no-underline"
          >
            GitHub
          </a>
          <Link
            href="/about"
            className="text-[#1E3448] hover:text-[#C2462E] transition-colors no-underline"
          >
            Despre
          </Link>
        </div>
      </div>
    </footer>
  );
}
