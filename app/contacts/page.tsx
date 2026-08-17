import { Empty, Panel } from "@/components/ui";
import { repo } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const [contacts, companies] = await Promise.all([repo.contacts(), repo.companies()]);
  const byId = new Map(companies.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Contacts — mémoire</h1>
        <p className="muted text-sm">Avant un appel : la fiche ultra-courte de ce qu&apos;il faut retenir.</p>
      </header>

      {contacts.length === 0 ? (
        <Empty>Aucun contact.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {contacts.map((ct) => {
            const company = byId.get(ct.companyId);
            const m = ct.memory;
            return (
              <Panel key={ct.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{ct.name}</h2>
                    <div className="text-xs muted">
                      {ct.role ?? "Contact"} · {company?.displayName ?? ct.companyId}
                    </div>
                  </div>
                  {ct.phone && <a className="btn-ghost text-xs" href={`tel:${ct.phone}`}>Appeler</a>}
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  <Line k="Achète / vend" v={m.dealsIn} />
                  <Line k="Volume habituel" v={m.usualVolume} />
                  <Line k="Dernière discussion" v={m.lastDiscussion} />
                  {m.lastObjection && <Line k="Dernière objection" v={m.lastObjection} />}
                  {m.commitment && <Line k="Engagement" v={m.commitment} />}
                  {m.nextAction && <Line k="Prochaine action" v={m.nextAction} highlight />}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Line({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="w-40 shrink-0 text-xs muted">{k}</span>
      <span style={highlight ? { color: "var(--copper-light)", fontWeight: 600 } : undefined}>{v}</span>
    </div>
  );
}
