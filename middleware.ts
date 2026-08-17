import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guard: verifies the signed session cookie (HMAC-SHA256 + expiry) at the
 * edge and redirects unauthenticated requests to /login. This mirrors
 * lib/auth/session signing. Server pages/services re-check authorization too —
 * this is the first gate, not the only one.
 */

const COOKIE = "encuivre_session";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  return "dev-insecure-secret-change-me";
}

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verify(token: string | undefined, now: number): Promise<boolean> {
  if (!token) return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
    if (b64urlFromBytes(sig) !== mac) return false;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as { exp?: number };
    return typeof data.exp === "number" && data.exp * 1000 >= now;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const ok = await verify(req.cookies.get(COOKIE)?.value, Date.now());
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Protect everything except the login page, Next internals and static assets.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
