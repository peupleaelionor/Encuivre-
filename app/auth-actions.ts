"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authenticate, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/constants";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ctx = await authenticate(email, password);
  if (!ctx) {
    redirect("/login?error=1");
  }
  await setSessionCookie(ctx.user.id);
  // Default the active org to the first membership.
  const jar = await cookies();
  if (ctx.memberships[0]) {
    jar.set(ACTIVE_ORG_COOKIE, ctx.memberships[0].organizationId, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  redirect("/ceo");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  const jar = await cookies();
  jar.delete(ACTIVE_ORG_COOKIE);
  redirect("/login");
}

export async function setActiveOrgAction(formData: FormData): Promise<void> {
  const orgId = String(formData.get("organizationId") ?? "");
  if (orgId) {
    const jar = await cookies();
    jar.set(ACTIVE_ORG_COOKIE, orgId, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  redirect("/ceo");
}
