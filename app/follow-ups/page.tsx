import { Empty, LevelBadge, Panel } from "@/components/ui";
import { allDealAlerts, followUpBuckets } from "@/lib/dashboard";
import { repo } from "@/lib/store";
import type { FollowUp } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const now = new Date();
  const [b, alerts, companies] = await Promise.all([
    followUpBuckets(now),
    allDealAlerts(now),
    repo.companies(),
  ]);
  const names = new Map(companies.map((c) => [c.id, c.displayName]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Relances & alertes</h1>
        <p className="muted text-sm">Aucun deal ne doit disparaître.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Bucket title="Aujourd'hui" items={b.today} names={names} />
        <Bucket title="En retard" items={b.overdue} names={names} danger />
        <Bucket title="7 prochains jours" items={b.next7Days} names={names} />
        <Bucket title="Sans activité" items={b.noActivity} names={names} />
      </div>

      <Panel title="Alertes automatiques">
        {alerts.length === 0 ? (
          <Empty>Aucune alerte.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {alerts.map((a, i) => (
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
    </div>
  );
}

function Bucket({
  title,
  items,
  names,
  danger,
}: {
  title: string;
  items: FollowUp[];
  names: Map<string, string>;
  danger?: boolean;
}) {
  return (
    <Panel title={`${title} (${items.length})`}>
      {items.length === 0 ? (
        <Empty>Rien ici.</Empty>
      ) : (
        <ul className="space-y-2">
          {items.map((f) => {
            return (
              <li key={f.id} className="panel panel-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{f.action}</div>
                  <div className="text-xs muted">{names.get(f.companyId) ?? f.companyId}</div>
                </div>
                <LevelBadge level={f.priority} />
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
