import { BuyerBadgeChip, Panel, ScorePill } from "@/components/ui";
import { scoreBuyerCompany } from "@/lib/buyer-score";
import { MATERIAL_LABELS } from "@/lib/enums";
import { formatEur, formatQuantity } from "@/lib/money";
import { buyers } from "@/lib/store";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const daysSince = (iso?: string) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS) : undefined;

export default function BuyersPage() {
  const rows = buyers()
    .map((c) => ({ company: c, score: scoreBuyerCompany(c, daysSince(c.lastContactAt)) }))
    .sort((a, b) => b.score.score - a.score.score);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Acheteurs</h1>
        <p className="muted text-sm">Score, badge et signaux (paiement, récurrence, marge générée).</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(({ company: c, score }) => (
          <Panel key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{c.displayName}</h2>
                  <BuyerBadgeChip badge={score.badge} />
                  <ScorePill score={score.score} />
                </div>
                <div className="text-xs muted">
                  {c.country} · {c.verification}
                </div>
              </div>
              {c.buyerMetrics && (
                <div className="text-right text-xs muted">
                  <div>Volume {formatQuantity(c.buyerMetrics.buyingVolumeKg)}/mois</div>
                  <div>Marge générée {formatEur(c.buyerMetrics.grossMarginGeneratedCents)}</div>
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {c.materials.map((m) => (
                <span key={m} className="chip">
                  {MATERIAL_LABELS[m]}
                </span>
              ))}
            </div>

            <ul className="mt-2 list-inside list-disc text-sm">
              {score.reasons.slice(0, 3).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}
