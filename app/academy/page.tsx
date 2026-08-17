import { Panel } from "@/components/ui";
import { academyModules } from "@/lib/academy-content";

export const dynamic = "force-static";

export default function AcademyPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">CEO Academy</h1>
        <p className="muted text-sm">Modules courts : matières, prix, incoterms, documents.</p>
      </header>

      {academyModules.map((mod) => (
        <Panel key={mod.id} title={mod.title}>
          <div className="grid gap-3 md:grid-cols-2">
            {mod.cards.map((card) => (
              <div key={card.id} className="panel panel-2">
                <h3 className="font-semibold">{card.term}</h3>
                <p className="mt-1 text-sm">{card.simple}</p>
                <p className="mt-1 text-xs muted">{card.professional}</p>
                <p className="mt-2 text-sm">
                  <span className="muted">Exemple EN CUIVRE : </span>
                  {card.example}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--amber)" }}>
                  ⚠ {card.pitfall}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
