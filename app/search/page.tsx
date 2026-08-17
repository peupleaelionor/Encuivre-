import Link from "next/link";
import { globalSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const hits = q.trim() ? globalSearch(q) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Recherche globale</h1>
        <p className="muted text-sm">Sociétés, contacts, matières, deals, offres, demandes.</p>
      </header>

      <form method="GET" className="flex gap-2">
        <input
          autoFocus
          name="q"
          defaultValue={q}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          placeholder="Rechercher…"
        />
        <button className="btn" type="submit">
          Chercher
        </button>
      </form>

      {q.trim() === "" ? (
        <p className="muted text-sm">Tapez un terme puis « Chercher ».</p>
      ) : hits.length === 0 ? (
        <p className="muted text-sm">Aucun résultat pour « {q} ».</p>
      ) : (
        <ul className="space-y-1.5">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`}>
              <Link href={h.href} className="panel panel-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{h.title}</div>
                  <div className="text-xs muted">{h.subtitle}</div>
                </div>
                <span className="chip">{h.kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
