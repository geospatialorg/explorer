import { cookies } from "next/headers";
import { verifySession, COOKIE_NAME } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import { ShieldIcon, LayersIcon, DatabaseIcon, UploadIcon, LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/collections", label: "Colecții", icon: LayersIcon },
  { href: "/admin/items", label: "Items", icon: DatabaseIcon },
  { href: "/admin/ingest", label: "Import CSV", icon: UploadIcon },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_SECRET ?? "dev-secret-change-me";
  const username = token ? await verifySession(token, secret) : null;

  if (!username) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b bg-amber-50/80 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-amber-800 font-medium">
            <ShieldIcon className="h-4 w-4" />
            Admin
          </span>
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-700">{username}</span>
          <LogoutButton />
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
