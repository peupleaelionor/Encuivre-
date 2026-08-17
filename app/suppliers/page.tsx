import { Panel, SupplierBadgeChip, ScorePill } from "@/components/ui";
import { scoreSupplierCompany } from "@/lib/supplier-score";
import { MATERIAL_LABELS, PROVENANCE_LABELS, SUPPLIER_BADGE_ORDER } from "@/lib/enums";
import { formatQuantity } from "@/lib/money";
import { suppliers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function SuppliersPage() {
  const rows = suppliers()
    .map((c) => ({ company: c, score: scoreSupplierCompany(c) }))
    .sort(
      (a, b) =>
        SUPPLIER_BADGE_ORDER[a.score.badge] - SUPPLIER_BADGE_ORDER[b.score.badge] ||
        b.score.score - a.score.score,
    );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Fournisseurs</h1>
        <p className="muted text-sm">Score, badge et raisons. Un fournisseur BLOQUÉ ne peut pas entrer dans un deal.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(({ company: c, score }) => (
          <Panel key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{c.displayName}</h2>
                  <SupplierBadgeChip badge={score.badge} />
                  <ScorePill score={score.score} />
                </div>
                <div className="text-xs muted">
                  {c.country} · {c.provenance ? PROVENANCE_LABELS[c.provenance] : "—"} ·{" "}
                  {c.verification}
                </div>
              </div>
              <div className="text-right text-xs muted">
                {c.capacityKg ? `Capacité ${formatQuantity(c.capacityKg)}/mois` : ""}
                {c.leadTimeDays ? <div>Délai {c.leadTimeDays} j</div> : null}
              </div>
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

            {c.supplierMetrics && (
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                <Metric label="Prix" v={c.supplierMetrics.pricing} />
                <Metric label="Qualité" v={c.supplierMetrics.quality} />
                <Metric label="Fiabilité" v={c.supplierMetrics.reliability} />
                <Metric label="Conformité" v={c.supplierMetrics.compliance} />
              </div>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, v }: { label: string; v: number }) {
  return (
    <div className="panel panel-2 py-2">
      <div className="text-sm font-semibold">{v}</div>
      <div className="muted">{label}</div>
    </div>
  );
}
