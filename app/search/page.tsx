"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { globalSearch } from "@/lib/search";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const hits = useMemo(() => globalSearch(q), [q]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Recherche globale</h1>
        <p className="muted text-sm">Sociétés, contacts, matières, deals, offres, demandes.</p>
      </header>

      <input
        autoFocus
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
        placeholder="Rechercher…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {q.trim() === "" ? (
        <p className="muted text-sm">Tapez pour rechercher.</p>
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
