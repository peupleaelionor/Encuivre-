# EN CUIVRE OS

Le **système d'exploitation du dirigeant** pour le négoce de cuivre et d'alliages.

> Le système se souvient. Le système classe. Le système calcule. Le système alerte.
> **Le PDG négocie, décide et signe.**

EN CUIVRE est une entreprise hybride franco-congolaise. Ce logiciel outille ses lignes
métier — **Trade** (négoce B2B, priorité n°1), **Circular** (rachat de chutes),
**Atelier** (premium), **House** (showroom), **Congo** (corridor RDC ↔ Europe) — en
mettant le dirigeant en position de décider vite, avec le minimum d'effort administratif.

## Ce que le PDG peut faire

- **CEO Command Center** (`/ceo`) : ≤ 8 KPI + « À faire aujourd'hui » (≤ 5 actions).
- **Focus** (`/focus`) : les 3 priorités du jour, classées par montant, marge,
  probabilité de closing, urgence et risque de perdre le deal.
- **Quick Sales** (`/quick-sales`) : « que puis-je vendre rapidement ? » — matching
  offre ↔ demande avec marge, score de compatibilité et de risque.
- **Devis + Margin Guard** (`/quotes/new`) : landed cost, prix de vente, marge brute,
  verdict GREEN/AMBER/RED (blocage si marge négative).
- **Que dois-je acheter ?** (`/buy-opportunities`) : BUY / WATCH / AVOID, jamais à l'aveugle.
- **Intelligence fournisseurs / acheteurs** (`/suppliers`, `/buyers`) : scores + badges.
- **Relances & alertes** (`/follow-ups`), **Contacts** (`/contacts`),
  **Academy** (`/academy`), **Glossaire** (`/glossary`), **Décisions** (`/decisions`),
  **Recherche globale** (`/search`).

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000  (redirige vers /ceo)
```

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement. |
| `npm run build` | Build de production. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Vérification TypeScript. |
| `npm test` | Tests unitaires (Vitest). |
| `npm run seed` | Résumé du dataset de démo (validation). |

## Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS 3 · Vitest.

## Architecture (résumé)

- Toute la **logique métier** est pure et testée dans `lib/*.ts`.
- **Argent** en centimes entiers (`lib/money.ts`), jamais de float naïf.
- **Persistance V1** : dataset typé (`lib/seed`) derrière une abstraction repository
  (`lib/store.ts`) — une vraie base peut être branchée sans toucher à l'UI.

Détails : voir [`CLAUDE.md`](./CLAUDE.md) et [`docs/`](./docs).

## Documentation

- [`docs/business-model.md`](./docs/business-model.md) — modèle économique.
- [`docs/trade-workflow.md`](./docs/trade-workflow.md) — flux Trade.
- [`docs/circular-workflow.md`](./docs/circular-workflow.md) — flux Circular.
- [`docs/ceo-operating-system.md`](./docs/ceo-operating-system.md) — logique CEO OS.
- [`docs/risk-controls.md`](./docs/risk-controls.md) — sécurité & risques.
- [`docs/copilot-audit.md`](./docs/copilot-audit.md) — audit de l'existant.
- [`docs/github-protection.md`](./docs/github-protection.md) — protection de branche & CI.

## Données de démo

Le dataset (`lib/seed`) est **réaliste mais clairement fictif** : 5 fournisseurs,
7 acheteurs, 3 « both », 12 offres, 15 demandes, 8 deals, documents à statuts variés,
relances, devis et décisions. Le tableau de bord est parlant immédiatement.
