"use client";

import { useMemo, useState } from "react";
import { glossaryTerms } from "@/lib/academy-content";

export default function GlossaryPage() {
  const [q, setQ] = useState("");
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const results = useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return glossaryTerms;
    return glossaryTerms.filter((t) => norm(`${t.term} ${t.definition} ${t.simple}`).includes(nq));
  }, [q]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Glossaire</h1>
        <p className="muted text-sm">Trouver un terme en quelques secondes.</p>
      </header>

      <input
        autoFocus
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
        placeholder="Rechercher : cathode, LME, FOB, COA…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="grid gap-2 md:grid-cols-2">
        {results.map((t) => (
          <div key={t.term} className="panel">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t.term}</h2>
              <span className="chip">{t.module}</span>
            </div>
            <p className="mt-1 text-sm">{t.simple}</p>
            <p className="mt-1 text-xs muted">{t.definition}</p>
          </div>
        ))}
        {results.length === 0 && <p className="muted text-sm">Aucun résultat.</p>}
      </div>
    </div>
  );
}
