import { Empty, LevelBadge, Panel, ScorePill } from "@/components/ui";
import { dealMarginCents, dealValueCents, focusPriorities } from "@/lib/dashboard";
import { MATERIAL_LABELS } from "@/lib/enums";
import { formatEur, formatQuantity, marginPercent } from "@/lib/money";
import { repo } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function FocusPage() {
  const now = new Date();
  const top3 = focusPriorities(now);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Focus — 3 priorités du jour</h1>
        <p className="muted text-sm">
          Classées par montant, marge, probabilité de closing, urgence et risque de perdre le deal.
        </p>
      </header>

      {top3.length === 0 ? (
        <Empty>Aucun deal ouvert. Créez un deal depuis Quick Sales.</Empty>
      ) : (
        <div className="space-y-4">
          {top3.map((d, i) => {
            const buyer = repo.company(d.buyerId);
            const supplier = d.supplierId ? repo.company(d.supplierId) : undefined;
            const margin = marginPercent(dealValueCents(d), dealValueCents(d) - dealMarginCents(d));
            return (
              <Panel key={d.id} className="border-l-4" >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold muted">#{i + 1}</span>
                      <h2 className="text-lg font-semibold">{d.title}</h2>
                      <LevelBadge level={d.priorityLevel} />
                      <ScorePill score={d.priorityScore} />
                    </div>
                    <div className="mt-1 text-sm muted">
                      {MATERIAL_LABELS[d.material]} · {formatQuantity(d.quantityKg)} ·{" "}
                      {buyer?.displayName ?? d.buyerId}
                      {supplier ? ` ← ${supplier.displayName}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs muted">Marge attendue</div>
                    <div className="text-xl font-semibold" style={{ color: "var(--copper-light)" }}>
                      {formatEur(dealMarginCents(d))}
                    </div>
                    <div className="text-xs muted">
                      {margin}% · valeur {formatEur(dealValueCents(d))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="panel panel-2">
                    <div className="text-xs muted">Prochaine action</div>
                    <div className="mt-1 font-medium">{d.nextAction ?? "À définir"}</div>
                    <div className="mt-1 text-xs muted">
                      Closing {Math.round(d.closeProbability * 100)}% · étape {d.stage}
                    </div>
                  </div>
                  <div className="panel panel-2">
                    <div className="text-xs muted">Pourquoi c&apos;est prioritaire</div>
                    <ul className="mt-1 list-inside list-disc text-sm">
                      {d.reasons.slice(0, 4).map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
