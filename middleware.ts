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

interface SessionClaims {
  ok: boolean;
  internal: boolean;
}

async function verify(token: string | undefined, now: number): Promise<SessionClaims> {
  const deny = { ok: false, internal: false };
  if (!token) return deny;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return deny;
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
    if (b64urlFromBytes(sig) !== mac) return deny;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as { exp?: number; int?: boolean };
    if (typeof data.exp !== "number" || data.exp * 1000 < now) return deny;
    return { ok: true, internal: data.int !== false };
  } catch {
    return deny;
  }
}

export async function middleware(req: NextRequest) {
  const { ok, internal } = await verify(req.cookies.get(COOKIE)?.value, Date.now());
  const path = req.nextUrl.pathname;

  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Role-based routing: portal users live under /portal; internal users everywhere else.
  const isPortalPath = path === "/portal" || path.startsWith("/portal/");
  if (!internal && !isPortalPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (internal && isPortalPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/ceo";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except the login page, Next internals and static assets.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
