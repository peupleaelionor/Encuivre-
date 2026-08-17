# CLAUDE.md — EN CUIVRE OS

Instructions persistantes pour toute session Claude Code / développeur sur ce dépôt.
**À lire en premier.** Ce fichier est la référence opérationnelle du projet.

---

## 1. Vision produit

EN CUIVRE OS est le **système d'exploitation du dirigeant** d'EN CUIVRE, entreprise
hybride franco-congolaise autour du cuivre et de ses alliages.

Règle fondamentale du logiciel :

> Le système se souvient. Le système classe. Le système calcule. Le système alerte.
> **Le PDG négocie, décide et signe.**

Le dirigeant doit fournir **le moins d'effort administratif et physique possible**.
Chaque écran doit répondre à : (1) quoi faire, (2) avec qui, (3) combien ça peut
rapporter, (4) quel est le risque, (5) quelle est la prochaine action.

## 2. Lignes métier (priorité décroissante)

1. **TRADE** (priorité n°1) — négoce B2B fournisseur ↔ acheteur, marge/commission
   sans immobiliser inutilement de capital.
2. **CIRCULAR** — rachat/valorisation de chutes (électriciens, plombiers, industrie).
3. **ATELIER** — activité premium légère (gravure, martelage, séries limitées).
4. **HOUSE** — showroom / e-commerce / image de marque (vitrine, pas moteur unique).
5. **CONGO** — corridor RDC ↔ France ↔ Europe, phase progressive.

## 3. Politique produit : **buyer before inventory**

On cherche autant que possible **l'acheteur avant d'acheter la matière**.
Aucun achat n'est recommandé « à l'aveugle » : voir `lib/buy-opportunities.ts`
(BUY / WATCH / AVOID, toujours justifié).

## 4. Architecture

- **Stack** : Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS 3 · Vitest.
- **Domaine pur** : toute la logique métier vit dans `lib/*.ts`, sans dépendance UI,
  et est **testée** (`tests/*.test.ts`). Les pages ne font qu'afficher.
- **Persistance V1** : dataset typé en dépôt (`lib/seed`) exposé via une **abstraction
  repository** (`lib/store.ts`, interface `Repository`). Aucune base externe requise.
  Pour brancher une vraie DB (Prisma/Postgres), implémenter `Repository` sans toucher
  aux pages ni aux moteurs. Voir `docs/copilot-audit.md` (dette volontaire).
- **Money** : `lib/money.ts` — **centimes entiers uniquement, jamais de float naïf**.

Modules clés :

| Fichier | Rôle |
|---|---|
| `lib/money.ts` | Arithmétique en centimes, marges, formatage. |
| `lib/pricing.ts` | Landed cost, devis, marge brute. |
| `lib/margin-guard.ts` | GREEN/AMBER/RED, blocage si marge négative/sous plancher. |
| `lib/deal-score.ts` | `calculateDealPriorityScore()` (0–100 + niveau + raisons). |
| `lib/supplier-score.ts` | Score + badge fournisseur (STRATEGIC…BLOCKED). |
| `lib/buyer-score.ts` | Score + badge acheteur (VIP…RISK). |
| `lib/matching.ts` | Quick Sales : SellOffer ↔ BuyRequest. |
| `lib/buy-opportunities.ts` | « Que dois-je acheter ? » (BUY/WATCH/AVOID). |
| `lib/follow-ups.ts` | Buckets Today/Overdue/7j/No-activity + alertes. |
| `lib/risk.ts` | Expiration documents + revue humaine forcée. |
| `lib/dashboard.ts` | Agrégation KPIs CEO, focus, à-faire-aujourd'hui. |

## 5. Commandes

```bash
npm install       # installe les dépendances
npm run dev       # dev server (http://localhost:3000)
npm run build     # build de production
npm run lint      # ESLint (next lint)
npm run typecheck # tsc --noEmit
npm test          # vitest run (tests unitaires)
npm run seed      # imprime un résumé du dataset de démo (validation seed)
```

**Critère de fin de toute tâche** : `lint`, `typecheck`, `test` et `build` passent.

## 6. Règles financières (NON négociables)

- Argent = **centimes entiers**. Jamais `float` pour un calcul monétaire.
- Prix exprimés en **centimes par tonne** ; quantités en **kilogrammes** (1 t = 1000 kg).
- Arrondi **explicite** et une seule fois par étape (`lib/money.ts`).
- Le **Margin Guard** doit être passé avant QUOTED/CONTRACT. Marge négative ⇒ blocage.
  Seuils configurables (`NEXT_PUBLIC_MARGIN_TARGET_PERCENT`, `NEXT_PUBLIC_MARGIN_FLOOR_PERCENT`).
- Un **LLM n'est jamais source de vérité financière**.

## 7. Conventions

- Enums = objets `as const` + union types (pas de `enum` TS), voir `lib/enums.ts`.
- Fonctions métier pures, entrées/sorties explicites, **retourner les raisons** (`reasons[]`)
  et non seulement un score — la logique ne doit pas être cachée.
- Dates passées explicitement (`now: Date`) pour rester déterministe et testable.
- Français pour l'UI ; code/identifiants en anglais.

## 8. Modules prioritaires (MVP)

CEO Command Center (`/ceo`), Focus (`/focus`), Quick Sales (`/quick-sales`),
Quote Builder + Margin Guard (`/quotes/new`), Buy Opportunities (`/buy-opportunities`),
Supplier/Buyer Intelligence (`/suppliers`, `/buyers`), Follow-ups (`/follow-ups`),
Contacts (`/contacts`), Academy (`/academy`), Glossary (`/glossary`),
Decisions (`/decisions`), Search (`/search`).

Matières promues : Copper Cathode Grade A, Millberry, Bars/Busbars, Tubes,
Sheets/Plates, Brass, Bronze, Aluminium. **Tin & Cobalt** existent dans le modèle
mais **ne sont pas promus** en MVP.

## 9. À NE PAS implémenter sans validation explicite

Trading automatisé avec argent réel · paiement matière intégré · crypto/blockchain ·
marketplace coltan · cobalt artisanal · achat d'or · Western Union · KYC « magique »
non connecté à un fournisseur réel · scraping sauvage · microservices · IA partout ·
LLM comme source de vérité financière · workflow cobalt/coltan sensible (Congo V1).

## 10. Sécurité (voir `docs/risk-controls.md`)

- Autorisation **côté serveur**, validation des entrées, pas de données financières
  sensibles exposées côté client au-delà du nécessaire.
- Pas de coordonnées bancaires stockées en V1 si non nécessaires.
- **Fournisseur BLOCKED** : jamais utilisable dans un deal (règle testée).
- **Sanctions screening** : architecture seulement, **revue humaine forcée**, aucune
  fausse solution automatique.

## 11. Tests obligatoires

`tests/` couvre : money, landed cost, quote, matching, deal priority, supplier score,
buyer score, **règle fournisseur bloqué**, **margin guard**, buy-opportunities,
follow-ups, intégrité du seed. Toute nouvelle logique métier vient **avec** ses tests.
