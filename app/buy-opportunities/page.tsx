import { Empty, Panel } from "@/components/ui";
import { classifyBuyOpportunity, type BuyOpportunityResult } from "@/lib/buy-opportunities";
import { MATERIAL_LABELS, PROVENANCE_LABELS, type BuyRecommendation } from "@/lib/enums";
import { formatEur, formatQuantity } from "@/lib/money";
import { repo } from "@/lib/store";

export const dynamic = "force-dynamic";

const REC_COLOR: Record<BuyRecommendation, string> = {
  BUY: "var(--green)",
  WATCH: "var(--amber)",
  AVOID: "var(--red)",
};

export default function BuyOpportunitiesPage() {
  const requests = repo.buyRequests();
  const results: BuyOpportunityResult[] = repo
    .sellOffers()
    .map((offer) => {
      const supplier = repo.company(offer.supplierId);
      if (!supplier) return null;
      return classifyBuyOpportunity({ offer, requests, supplier });
    })
    .filter((r): r is BuyOpportunityResult => r !== null)
    .sort((a, b) => rank(b.recommendation) - rank(a.recommendation) || b.bestMarginPercent - a.bestMarginPercent);

  const buys = results.filter((r) => r.recommendation === "BUY");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Que dois-je acheter ?</h1>
        <p className="muted text-sm">
          Politique « acheteur avant stock » : un achat n&apos;est recommandé que s&apos;il existe une
          demande réelle, une rotation, un bon prix et un risque maîtrisé.
        </p>
      </header>

      <Panel title={`${buys.length} achat(s) recommandé(s)`}>
        {results.length === 0 ? (
          <Empty>Aucune offre à analyser.</Empty>
        ) : (
          <div className="space-y-2">
            {results.map((r) => {
              const supplier = repo.company(r.offer.supplierId);
              return (
                <div key={r.offer.id} className="panel panel-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="chip font-semibold"
                          style={{ color: REC_COLOR[r.recommendation], borderColor: "var(--border)" }}
                        >
                          {r.recommendation}
                        </span>
                        <span className="font-medium">{MATERIAL_LABELS[r.offer.material]}</span>
                        {r.lowCapital && (
                          <span className="chip" style={{ color: "var(--copper-light)" }}>
                            Faible capital
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs muted">
                        {supplier?.displayName} · {PROVENANCE_LABELS[r.offer.provenance]} ·{" "}
                        {formatQuantity(r.offer.quantityKg)}
                      </div>
                      <ul className="mt-2 list-inside list-disc text-sm">
                        {r.reasons.slice(0, 3).map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right text-sm">
                      <div className="muted text-xs">Capital requis</div>
                      <div className="font-semibold">{formatEur(r.capitalRequiredCents)}</div>
                      <div className="muted mt-1 text-xs">Meilleure marge</div>
                      <div>{r.bestMarginPercent}%</div>
                      <div className="muted mt-1 text-xs">Demande couverte</div>
                      <div>{formatQuantity(r.matchingDemandKg)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function rank(rec: BuyRecommendation): number {
  return rec === "BUY" ? 2 : rec === "WATCH" ? 1 : 0;
}
