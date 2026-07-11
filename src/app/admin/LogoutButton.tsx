"use client";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/logout`, { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-amber-800 hover:text-amber-900 hover:bg-amber-100">
      <LogOutIcon className="h-4 w-4 mr-1.5" />
      Deconectare
    </Button>
  );
}
