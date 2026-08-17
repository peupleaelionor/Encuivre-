import { Empty, Panel, ScorePill } from "@/components/ui";
import { findMatches } from "@/lib/matching";
import { MATERIAL_LABELS } from "@/lib/enums";
import { formatEur, formatQuantity } from "@/lib/money";
import { repo } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function QuickSalesPage() {
  const [offers, requests, companies] = await Promise.all([
    repo.sellOffers(),
    repo.buyRequests(),
    repo.companies(),
  ]);
  const matches = findMatches(offers, requests, companies, { minCompatibility: 30 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Quick Sales</h1>
        <p className="muted text-sm">Que puis-je vendre rapidement ? (offre ↔ demande, marge positive)</p>
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
                      <button className="btn text-xs" type="button">
                        Créer un deal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="text-xs muted">
        Règle : un fournisseur BLOQUÉ n&apos;apparaît jamais ici. Le bouton « Créer un deal » est câblé
        pour la V2 (persistance).
      </p>
    </div>
  );
}
