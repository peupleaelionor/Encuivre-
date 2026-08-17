import Link from "next/link";
import { Empty, Kpi, LevelBadge, Panel } from "@/components/ui";
import { ceoKpis, todayActions, allDealAlerts, dealsNeedingReview } from "@/lib/dashboard";
import { documentExpiryAlerts } from "@/lib/risk";

export const dynamic = "force-dynamic";

export default function CeoPage() {
  const now = new Date();
  const kpis = ceoKpis(now);
  const actions = todayActions(now);
  const alerts = allDealAlerts(now);
  const docAlerts = documentExpiryAlerts(now);
  const reviews = dealsNeedingReview(now);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">CEO Command Center</h1>
        <p className="muted text-sm">Comprendre l&apos;entreprise en moins de 30 secondes.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Kpi key={k.key} label={k.label} value={k.value} hint={k.hint} />
        ))}
      </div>

      <Panel
        title="À faire aujourd'hui"
        right={<Link href="/focus" className="btn-ghost text-xs">Focus →</Link>}
      >
        {actions.length === 0 ? (
          <Empty>Rien d&apos;urgent. Profitez-en pour prospecter.</Empty>
        ) : (
          <ul className="space-y-2">
            {actions.map((a, i) => (
              <li key={i} className="panel panel-2 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs muted">
                    {a.company} · {a.reason}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: "var(--copper-light)" }}>
                      {a.potentialValue}
                    </div>
                    <div className="text-xs muted">{a.deadline}</div>
                  </div>
                  <Link href={a.href} className="btn text-xs">
                    Traiter
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Alertes deals">
          {alerts.length === 0 ? (
            <Empty>Aucune alerte deal.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {alerts.slice(0, 8).map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span>{a.message}</span>
                  <span className="chip" style={{ color: "var(--amber)" }}>
                    {a.kind}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Documents à surveiller">
          {docAlerts.length === 0 ? (
            <Empty>Aucun document à risque.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {docAlerts.map((d) => (
                <li key={d.documentId} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {d.type}
                    {d.dealId ? ` · ${d.dealId}` : ""}
                  </span>
                  <span
                    className="chip"
                    style={{ color: d.status === "EXPIRED" ? "var(--red)" : "var(--amber)" }}
                  >
                    {d.status === "EXPIRED" ? "Expiré" : `J-${d.daysToExpiry}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {reviews.length > 0 && (
        <Panel title="Revue humaine requise">
          <ul className="space-y-1.5">
            {reviews.map((r) => (
              <li key={r.dealId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{r.title}</span>
                <span className="text-xs" style={{ color: "var(--red)" }}>
                  {r.reasons.join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Vue rapide" right={<span className="text-xs muted">Légende priorités</span>}>
        <div className="flex flex-wrap gap-2">
          <LevelBadge level="HOT" />
          <LevelBadge level="WARM" />
          <LevelBadge level="COOL" />
          <LevelBadge level="COLD" />
        </div>
      </Panel>
    </div>
  );
}
