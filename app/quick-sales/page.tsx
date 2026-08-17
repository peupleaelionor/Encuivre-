import Link from "next/link";
import { Empty, Panel, ScorePill } from "@/components/ui";
import { findMatches } from "@/lib/matching";
import { MATERIAL_LABELS } from "@/lib/enums";
import { formatEur, formatQuantity } from "@/lib/money";
import { repo } from "@/lib/store";
import { createDealFromMatchAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default function QuickSalesPage() {
  const matches = findMatches(repo.sellOffers(), repo.buyRequests(), repo.companies(), {
    minCompatibility: 30,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quick Sales</h1>
          <p className="muted text-sm">Que puis-je vendre rapidement ? (offre ↔ demande, marge positive)</p>
        </div>
        <div className="flex gap-2">
          <Link href="/offers/new" className="btn-ghost text-xs">+ Offre</Link>
          <Link href="/requests/new" className="btn-ghost text-xs">+ Demande</Link>
        </div>
      </header>

      <Panel title={`${matches.length} match(s) exploitable(s)`}>
        {matches.length === 0 ? (
          <Empty>Aucun match. Ajoutez des offres ou des demandes.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr>
                  <th className="th">Vendeur → Acheteur</th>
                  <th className="th">Matière</th>
                  <th className="th">Volume</th>
                  <th className="th">Coût ind.</th>
                  <th className="th">Prix ind.</th>
                  <th className="th">Marge brute</th>
                  <th className="th">Marge %</th>
                  <th className="th">Compat.</th>
                  <th className="th">Risque</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={`${m.offer.id}-${m.request.id}`}>
                    <td className="td">
                      <div className="font-medium">{m.supplier.displayName}</div>
                      <div className="text-xs muted">→ {m.buyer.displayName}</div>
                    </td>
                    <td className="td">{MATERIAL_LABELS[m.material]}</td>
                    <td className="td">{formatQuantity(m.matchableQuantityKg)}</td>
                    <td className="td">{formatEur(m.indicativeCostCents)}</td>
                    <td className="td">{formatEur(m.indicativePriceCents)}</td>
                    <td className="td" style={{ color: "var(--copper-light)" }}>
                      {formatEur(m.grossMarginCents)}
                    </td>
                    <td className="td">{m.grossMarginPercent}%</td>
                    <td className="td">
                      <ScorePill score={m.compatibilityScore} />
                    </td>
                    <td className="td">
                      <span
                        className="chip"
                        style={{ color: m.riskScore >= 40 ? "var(--red)" : "var(--muted)" }}
                      >
                        {m.riskScore}
                      </span>
                    </td>
                    <td className="td">
                      <form action={createDealFromMatchAction}>
                        <input type="hidden" name="offerId" value={m.offer.id} />
                        <input type="hidden" name="requestId" value={m.request.id} />
                        <button className="btn text-xs" type="submit">
                          Créer un deal
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="text-xs muted">
        Règle : un fournisseur BLOQUÉ n&apos;apparaît jamais ici. « Créer un deal » enregistre un deal
        en base (étape QUALIFIED) à partir du match.
      </p>
    </div>
  );
}
