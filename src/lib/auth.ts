export const COOKIE_NAME = "explorer_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function b64url(buf: ArrayBuffer): string {
  return btoa(Array.from(new Uint8Array(buf), (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(username: string, secret: string): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${username}.${expires}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function verifySession(token: string, secret: string): Promise<string | null> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const dotIdx = payload.indexOf(".");
  if (dotIdx === -1) return null;
  const username = payload.slice(0, dotIdx);
  const expires = parseInt(payload.slice(dotIdx + 1), 10);
  if (isNaN(expires) || Date.now() > expires) return null;
  const key = await getKey(secret);
  const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  if (sig !== b64url(expected)) return null;
  return username;
}

export function checkCredentials(username: string, password: string): boolean {
  const raw = (process.env.ADMIN_CREDENTIALS ?? "").trim().replace(/^["']|["']$/g, "");
  return raw.split(",").some((pair) => {
    const sep = pair.indexOf(":");
    if (sep === -1) return false;
    return pair.slice(0, sep) === username && pair.slice(sep + 1) === password;
  });
}
