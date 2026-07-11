import { cookies } from "next/headers";
import { verifySession, COOKIE_NAME } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import { ShieldIcon } from "lucide-react";

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
        <span className="flex items-center gap-2 text-amber-800 font-medium">
          <ShieldIcon className="h-4 w-4" />
          Admin — conectat ca <strong>{username}</strong>
        </span>
        <LogoutButton />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
