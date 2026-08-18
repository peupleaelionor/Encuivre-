/**
 * Server-side sessions: signed, httpOnly cookie (HMAC via AUTH_SECRET), verified
 * on every request. See docs/adr/002-auth.md.
 *
 * Server-only (uses next/headers + the DB). Never import from a Client Component.
 */

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { loadContext } from "./queries";
import type { AuthContext } from "./rbac";

export { loadContext, authenticate } from "./queries";

const COOKIE = "encuivre_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set (>=16 chars) in production.");
  }
  return "dev-insecure-secret-change-me"; // dev only
}

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Create a signed session token for a user id. `internal` marks internal-tenant users. */
export function signSession(userId: string, internal = true, now: number = Date.now()): string {
  const exp = Math.floor(now / 1000) + MAX_AGE_SECONDS;
  const payload = b64url(JSON.stringify({ sub: userId, int: internal, exp }));
  return `${payload}.${sign(payload)}`;
}

/** Verify a token; return the userId if valid and unexpired, else null. */
export function verifySession(token: string | undefined, now: number = Date.now()): string | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub: string; exp: number };
    if (typeof data.exp !== "number" || data.exp * 1000 < now) return null;
    return data.sub;
  } catch {
    return null;
  }
}

/** The current authenticated context, or null. Reads and verifies the cookie. */
export async function getCurrentUser(): Promise<AuthContext | null> {
  const jar = await cookies();
  const userId = verifySession(jar.get(COOKIE)?.value);
  if (!userId) return null;
  return loadContext(userId);
}

export async function setSessionCookie(userId: string, internal = true): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, signSession(userId, internal), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export { COOKIE as SESSION_COOKIE };
