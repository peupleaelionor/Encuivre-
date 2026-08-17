import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { MobileBar, Sidebar } from "@/components/nav";
import { AppHeader, type HeaderOrg } from "@/components/app-header";
import { getCurrentUser } from "@/lib/auth/session";
import { organizationsByIds } from "@/lib/auth/queries";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/constants";

export const metadata: Metadata = {
  title: "EN CUIVRE OS",
  description:
    "CEO operating system pour le négoce de cuivre et d'alliages : le système se souvient, classe, calcule et alerte — le PDG négocie, décide et signe.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentUser();
  let orgs: HeaderOrg[] = [];
  let activeOrgId: string | undefined;

  if (ctx) {
    const names = new Map(
      (await organizationsByIds(ctx.memberships.map((m) => m.organizationId))).map((o) => [o.id, o.displayName]),
    );
    orgs = ctx.memberships.map((m) => ({
      id: m.organizationId,
      name: names.get(m.organizationId) ?? m.organizationId,
      role: m.role,
    }));
    activeOrgId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value ?? orgs[0]?.id;
  }

  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            {ctx && (
              <AppHeader
                userName={ctx.user.name}
                userEmail={ctx.user.email}
                activeOrgId={activeOrgId}
                orgs={orgs}
              />
            )}
            <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
        <MobileBar />
      </body>
    </html>
  );
}
