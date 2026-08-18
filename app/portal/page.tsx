import Link from "next/link";
import { redirect } from "next/navigation";
import { Empty, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import {
  getPortalCompany,
  getPortalDeals,
  getVisibleOffers,
  getVisibleRequests,
} from "@/lib/services/data";
import { MATERIAL_LABELS } from "@/lib/enums";
import { formatEur, formatQuantity } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/login");

  const [company, offers, requests, deals] = await Promise.all([
    getPortalCompany(ctx),
    getVisibleOffers(ctx),
    getVisibleRequests(ctx),
    getPortalDeals(ctx),
  ]);

  const canOffer = can(ctx, "CREATE_OFFER");
  const canRequest = can(ctx, "CREATE_REQUEST");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portail — {company?.displayName ?? ctx.user.name}</h1>
          <p className="muted text-sm">
            Vos offres, demandes et deals partagés avec EN CUIVRE. Les marges internes ne sont jamais visibles ici.
          </p>
        </div>
        <div className="flex gap-2">
          {canOffer && <Link href="/portal/offers/new" className="btn text-xs">+ Offre (RFO)</Link>}
          {canRequest && <Link href="/portal/requests/new" className="btn text-xs">+ Demande (RFQ)</Link>}
        </div>
      </header>

      {company && (
        <Panel title="Ma société">
          <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div><span className="muted">Raison sociale : </span>{company.legalName}</div>
            <div><span className="muted">Pays : </span>{company.country}</div>
            <div><span className="muted">Vérification : </span>{company.verification}</div>
          </div>
        </Panel>
      )}

      {canOffer && (
        <Panel title={`Mes offres — RFO (${offers.length})`}>
          {offers.length === 0 ? (
            <Empty>Aucune offre. Proposez une matière à la vente.</Empty>
          ) : (
            <ul className="space-y-2">
              {offers.map((o) => (
                <li key={o.id} className="panel panel-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{MATERIAL_LABELS[o.material]} · grade {o.grade}</div>
                    <div className="text-xs muted">{o.location} · {formatQuantity(o.quantityKg)}</div>
                  </div>
                  <div className="text-sm" style={{ color: "var(--copper-light)" }}>
                    {formatEur(o.pricePerTonneCents)}/t
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {canRequest && (
        <Panel title={`Mes demandes — RFQ (${requests.length})`}>
          {requests.length === 0 ? (
            <Empty>Aucune demande. Exprimez un besoin d&apos;achat.</Empty>
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="panel panel-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{MATERIAL_LABELS[r.material]} · min {r.minGrade}</div>
                    <div className="text-xs muted">{r.location} · {formatQuantity(r.quantityKg)}</div>
                  </div>
                  <div className="text-sm" style={{ color: "var(--copper-light)" }}>
                    ≤ {formatEur(r.targetPricePerTonneCents)}/t
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <Panel title={`Mes deals (${deals.length})`}>
        {deals.length === 0 ? (
          <Empty>Aucun deal partagé pour l&apos;instant.</Empty>
        ) : (
          <ul className="space-y-2">
            {deals.map((d) => (
              <li key={d.id} className="panel panel-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs muted">
                    {MATERIAL_LABELS[d.material]} · {formatQuantity(d.quantityKg)} · étape {d.stage}
                  </div>
                </div>
                <div className="text-sm">{formatEur(d.salePricePerTonneCents)}/t</div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
