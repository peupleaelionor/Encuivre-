"use client";

import { usePathname } from "next/navigation";
import { logoutAction, setActiveOrgAction } from "@/app/auth-actions";

export interface HeaderOrg {
  id: string;
  name: string;
  role: string;
}

export function AppHeader({
  userName,
  userEmail,
  activeOrgId,
  orgs,
}: {
  userName: string;
  userEmail: string;
  activeOrgId?: string;
  orgs: HeaderOrg[];
}) {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const active = orgs.find((o) => o.id === activeOrgId) ?? orgs[0];

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-2 md:px-8"
      style={{ borderColor: "var(--border)", background: "var(--bg)" }}
    >
      <div className="flex items-center gap-2">
        {orgs.length > 1 ? (
          <form action={setActiveOrgAction}>
            <select
              name="organizationId"
              defaultValue={active?.id}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-lg px-2 py-1 text-xs"
              style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {o.role}
                </option>
              ))}
            </select>
          </form>
        ) : (
          <span className="chip" title={active?.role}>
            {active?.name ?? "—"} · {active?.role ?? ""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-xs font-medium">{userName}</div>
          <div className="text-[11px] muted">{userEmail}</div>
        </div>
        <form action={logoutAction}>
          <button className="btn-ghost text-xs" type="submit">
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
