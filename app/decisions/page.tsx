import { Empty, Panel } from "@/components/ui";
import { repo } from "@/lib/store";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "var(--amber)",
  REVIEWING: "var(--copper-light)",
  CLOSED: "var(--green)",
};

export default async function DecisionsPage() {
  const decisions = await repo.decisions();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Journal de décisions</h1>
        <p className="muted text-sm">Capitaliser sur l&apos;expérience du dirigeant.</p>
      </header>

      {decisions.length === 0 ? (
        <Empty>Aucune décision enregistrée.</Empty>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Panel key={d.id}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{d.title}</h2>
                <span className="chip" style={{ color: STATUS_COLOR[d.status] ?? "var(--muted)" }}>
                  {d.status}
                </span>
              </div>
              <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                <Field k="Contexte" v={d.context} />
                <Field k="Décision" v={d.decision} />
                <Field k="Justification" v={d.rationale} />
                <Field k="Résultat attendu" v={d.expectedOutcome} />
                {d.actualOutcome && <Field k="Résultat réel" v={d.actualOutcome} />}
                {d.reviewAt && (
                  <Field k="Revue prévue" v={new Date(d.reviewAt).toLocaleDateString("fr-FR")} />
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs muted">{k}</div>
      <div>{v}</div>
    </div>
  );
}
