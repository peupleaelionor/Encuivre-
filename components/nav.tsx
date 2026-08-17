"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Décider",
    items: [
      { href: "/ceo", label: "CEO Command Center" },
      { href: "/focus", label: "Focus — 3 priorités" },
      { href: "/follow-ups", label: "Relances & alertes" },
      { href: "/documents", label: "Documents" },
    ],
  },
  {
    label: "Trader",
    items: [
      { href: "/quick-sales", label: "Quick Sales" },
      { href: "/quotes/new", label: "Nouveau devis" },
      { href: "/buy-opportunities", label: "Que dois-je acheter ?" },
    ],
  },
  {
    label: "Connaître",
    items: [
      { href: "/suppliers", label: "Fournisseurs" },
      { href: "/buyers", label: "Acheteurs" },
      { href: "/contacts", label: "Contacts" },
      { href: "/search", label: "Recherche" },
    ],
  },
  {
    label: "Capitaliser",
    items: [
      { href: "/decisions", label: "Journal de décisions" },
      { href: "/academy", label: "CEO Academy" },
      { href: "/glossary", label: "Glossaire" },
    ],
  },
];

const MOBILE: { href: string; label: string }[] = [
  { href: "/ceo", label: "Today" },
  { href: "/focus", label: "Deals" },
  { href: "/contacts", label: "Contacts" },
  { href: "/quotes/new", label: "Devis" },
];

export function Sidebar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <aside className="hidden w-64 shrink-0 border-r p-4 md:block" style={{ borderColor: "var(--border)" }}>
      <Link href="/ceo" className="mb-6 block">
        <div className="text-lg font-bold tracking-tight">
          EN CUIVRE <span style={{ color: "var(--copper-light)" }}>OS</span>
        </div>
        <div className="text-xs muted">Le système se souvient. Le PDG décide.</div>
      </Link>
      <nav className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide muted">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-3 py-1.5 text-sm"
                      style={{
                        background: active ? "var(--panel-2)" : "transparent",
                        color: active ? "var(--text)" : "var(--muted)",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function MobileBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex border-t md:hidden"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      {MOBILE.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 py-3 text-center text-xs font-medium"
            style={{ color: active ? "var(--copper-light)" : "var(--muted)" }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
