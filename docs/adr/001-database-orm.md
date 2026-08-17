# ADR 001 — Base de données & ORM

_Statut : accepté — Sprint 1._

## Contexte

La V1 stocke ses données dans un dataset typé en mémoire (`lib/seed`) derrière une
interface `Repository`. Le Sprint 1 exige une **base PostgreSQL réelle**, des migrations,
et une testabilité en CI **sans dépendre d'un service externe**. Le domaine ne doit pas
dépendre d'un fournisseur (Supabase) particulier.

## Options évaluées

| Critère | Prisma | **Drizzle** |
|---|---|---|
| TypeScript / typage | Bon (client généré) | Excellent (schéma = types, requêtes typées) |
| Migrations | `prisma migrate` (moteur binaire) | `drizzle-kit generate` → SQL lisible et versionné |
| PostgreSQL | Oui | Oui (dialecte natif) |
| Runtime | Moteur binaire à télécharger (fragile en CI) | Pur TS, driver au choix |
| Testabilité sans serveur | Difficile (besoin d'un Postgres) | **PGlite** (Postgres WASM en process) — hermétique |
| Compat. Next.js (edge/bundling) | Moteur natif lourd | Léger, tree-shakeable |

## Décision

**Drizzle ORM** + **PostgreSQL**, avec une **abstraction de driver** :

- **Production** : driver `postgres` (postgres-js) via `DATABASE_URL` (Supabase ou tout
  Postgres). Le service-role n'est jamais exposé au navigateur.
- **Développement / test / CI** : **PGlite** (`@electric-sql/pglite`) — un vrai
  PostgreSQL 16 compilé en WASM, exécuté **en process**, sans serveur. Le dialecte est
  identique à la production ; les tests sont hermétiques et rapides.

Le même **schéma Drizzle** (`lib/db/schema.ts`) et les mêmes migrations SQL
(`drizzle/`) servent les deux. Le choix du driver est déterminé par `DATABASE_URL`
(absent → PGlite).

## Conséquences

- Le `Repository` passe en **asynchrone** ; les moteurs métier restent purs (ils ne
  connaissent pas l'ORM — règle Sprint §15).
- Migrations générées par `drizzle-kit` et appliquées par un migrator (auto en dev/test,
  étape `npm run db:migrate` en production).
- Aucune dépendance à Supabase dans le domaine : Supabase n'est qu'un fournisseur possible
  de `DATABASE_URL` (et d'auth, cf. ADR 002).
