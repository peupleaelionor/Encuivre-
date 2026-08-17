/**
 * Global search — simple, no-AI substring search across companies, contacts,
 * materials, deals, offers and requests.
 */

import { MATERIALS, MATERIAL_LABELS, type Material } from "./enums";
import { repo, type Repository } from "./store";

export type SearchKind = "company" | "contact" | "material" | "deal" | "offer" | "request";

export interface SearchHit {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export async function globalSearch(query: string, r: Repository = repo): Promise<SearchHit[]> {
  const q = norm(query.trim());
  if (!q) return [];
  const hits: SearchHit[] = [];

  const [allCompanies, allContacts, allDeals, allOffers, allRequests] = await Promise.all([
    r.companies(),
    r.contacts(),
    r.deals(),
    r.sellOffers(),
    r.buyRequests(),
  ]);

  for (const c of allCompanies) {
    if (norm(`${c.displayName} ${c.legalName} ${c.country}`).includes(q)) {
      hits.push({
        kind: "company",
        id: c.id,
        title: c.displayName,
        subtitle: `${c.role} · ${c.country}`,
        href: c.role === "BUYER" ? "/buyers" : "/suppliers",
      });
    }
  }

  for (const ct of allContacts) {
    if (norm(`${ct.name} ${ct.role ?? ""} ${ct.email ?? ""}`).includes(q)) {
      hits.push({
        kind: "contact",
        id: ct.id,
        title: ct.name,
        subtitle: ct.role ?? "Contact",
        href: "/contacts",
      });
    }
  }

  for (const m of MATERIALS as readonly Material[]) {
    if (norm(`${m} ${MATERIAL_LABELS[m]}`).includes(q)) {
      hits.push({
        kind: "material",
        id: m,
        title: MATERIAL_LABELS[m],
        subtitle: "Matière",
        href: "/quick-sales",
      });
    }
  }

  for (const d of allDeals) {
    if (norm(`${d.title} ${d.stage} ${MATERIAL_LABELS[d.material]}`).includes(q)) {
      hits.push({ kind: "deal", id: d.id, title: d.title, subtitle: `Deal · ${d.stage}`, href: "/focus" });
    }
  }

  for (const o of allOffers) {
    if (norm(`${MATERIAL_LABELS[o.material]} ${o.location} ${o.country}`).includes(q)) {
      hits.push({
        kind: "offer",
        id: o.id,
        title: `${MATERIAL_LABELS[o.material]} · ${o.location}`,
        subtitle: "Offre de vente",
        href: "/quick-sales",
      });
    }
  }

  for (const br of allRequests) {
    if (norm(`${MATERIAL_LABELS[br.material]} ${br.location} ${br.country}`).includes(q)) {
      hits.push({
        kind: "request",
        id: br.id,
        title: `${MATERIAL_LABELS[br.material]} · ${br.location}`,
        subtitle: "Demande d'achat",
        href: "/quick-sales",
      });
    }
  }

  return hits;
}
