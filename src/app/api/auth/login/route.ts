import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, signSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password || !checkCredentials(username, password)) {
    return NextResponse.json({ error: "Credențiale incorecte" }, { status: 401 });
  }

  const secret = process.env.ADMIN_SECRET ?? "dev-secret-change-me";
  const token = await signSession(username, secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return res;
}
