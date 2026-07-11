import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

export async function requireAdmin(): Promise<{ error: NextResponse } | { username: string }> {
  const token = cookies().get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_SECRET ?? "dev-secret-change-me";
  if (!token) return { error: NextResponse.json({ error: "Neautentificat" }, { status: 401 }) };
  const username = await verifySession(token, secret);
  if (!username) return { error: NextResponse.json({ error: "Sesiune invalidă" }, { status: 401 }) };
  return { username };
}
