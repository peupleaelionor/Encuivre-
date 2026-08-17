# V2 — Baseline de la V1 (avant Sprint 1)

_Mesuré sur `feat/intelligent-platform-v2`, branché depuis `main` (V1 mergée)._

## Résultat des contrôles

| Contrôle | Résultat |
|---|---|
| `npm install` | ✅ |
| `npm run typecheck` | ✅ (après nettoyage `.next` — types de routes en cache d'une autre branche) |
| `npm run lint` | ✅ aucun warning |
| `npm test` | ✅ **73 tests** (10 fichiers) |
| `npm run build` | ✅ **15 routes** |

## Routes existantes (à conserver)

`/` → `/ceo`, `/focus`, `/quick-sales`, `/quotes/new`, `/buy-opportunities`,
`/suppliers`, `/buyers`, `/contacts`, `/follow-ups`, `/documents`, `/academy`,
`/glossary`, `/decisions`, `/search`.

## Modules métier à conserver (ne pas réécrire)

`lib/money`, `lib/pricing`, `lib/margin-guard`, `lib/deal-score`, `lib/supplier-score`,
`lib/buyer-score`, `lib/matching`, `lib/buy-opportunities`, `lib/follow-ups`, `lib/risk`,
`lib/market`, `lib/dashboard`, `lib/search`, `lib/academy-content`, `lib/enums`,
`lib/types`. Ces moteurs sont **purs** (entrées/sorties de données, aucune dépendance
ORM) et le restent (règle Sprint §15).

## État du repository (persistance)

- V1 : `lib/store.ts` expose une interface `Repository` **synchrone** alimentée par le
  dataset typé `lib/seed` (`SeedRepository`).
- Cette interface est le point d'insertion de la base réelle. Sprint 1 la fait passer en
  **asynchrone** et fournit un `PostgresRepository`, sans réécrire les moteurs.

## Dette existante (constatée)

1. Aucune persistance réelle (seed en mémoire).
2. Aucune authentification / multi-utilisateur / RBAC.
3. Écriture non persistée (boutons « Créer un deal », « Passer en QUOTED » non câblés).
4. Pas de notion d'organisation / tenant / scope de données.
5. Pas de tests d'intégration base ni de tests de permissions.

Le Sprint 1 adresse les points 1, 2, 4, 5 et amorce le 3 (writes via repository + actions).

## Règle de non-régression

Toute régression introduite par le Sprint doit être corrigée : les 73 tests V1 doivent
rester verts, et le build fonctionnel, à la fin du sprint.
