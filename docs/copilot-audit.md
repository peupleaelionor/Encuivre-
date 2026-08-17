# Audit de l'existant

_Date : 2026-08-16._

## Contexte de la reprise

La mission décrivait une « fondation Copilot » d'EN CUIVRE OS à auditer et compléter.
**L'inspection factuelle contredit cette prémisse** — c'est le premier résultat de l'audit :

- Repo **`peupleaelionor/Encuivre-`** (le dépôt au nom d'EN CUIVRE) : **vide**, un seul
  fichier `README.md` de 11 octets. Historique : `Initial commit`, `Initial plan`,
  puis un merge PR#1 `copilot/audit-repository-structure` sans code applicatif.
- Repo **`peupleaelionor/plateforme-de-jeux`** : une **plateforme de jeux africains**
  complète (Awale, Jollof Master, etc.) construite avec v0 — **sans aucun rapport** avec
  le cuivre. Elle n'a pas été modifiée.

**Conclusion** : il n'existait aucune fondation EN CUIVRE OS à auditer. EN CUIVRE OS a
donc été construit de zéro dans le dépôt `Encuivre-`, en respectant l'esprit de la mission
(fiabilité, testabilité, décision rapide du PDG).

L'audit ci-dessous porte donc sur l'état de départ (vide) et sur les décisions prises.

## Solide (ce qui était exploitable)

- La **nomenclature de branches** et la structure GitHub étaient en place (branche de
  travail dédiée existante).
- Le **cahier des charges** fourni était précis et a servi de spécification directe.

## À renforcer (fonctionnel mais fragile — décisions prises)

- **Persistance** : plutôt qu'une base externe fragile en CI, la V1 utilise un dataset
  typé (`lib/seed`) derrière une **abstraction repository** (`lib/store.ts`). C'est
  fonctionnel et testable, mais volontairement non persistant (voir « Dette volontaire »).
- **Auth** : la V1 est un outil mono-opérateur sans auth externe. Le modèle de rôles
  (`ownerId`, `CompanyRole`) est prêt, mais l'authentification réelle est reportée.
- **Bouton « Créer un deal »** (Quick Sales) : présent, câblage de persistance en V2.

## Incorrect / risqué (corrigé d'emblée)

- **Risque de float monétaire** : évité dès le départ — tout l'argent est en centimes
  entiers (`lib/money.ts`), avec tests anti-drift.
- **Fournisseur douteux dans un deal** : la règle « fournisseur BLOCKED interdit » est
  implémentée **et testée** dans `matching.ts` et `buy-opportunities.ts`.
- **Marge négative validée** : impossible — le Margin Guard bloque (`margin-guard.ts`).
- **CVE Next.js** : `next@15.1.6` (CVE-2025-66478) a été remplacé par `15.5.23` patché.

## Manquant (livré dans ce MVP)

CEO Command Center, Focus, Deal Priority Score, Quick Sales matching, Supplier/Buyer
Intelligence, Contact Memory, Follow-up engine, Quote Builder, Margin Guard,
Buy-opportunities, Academy, Glossaire, Decision log, Document readiness, Risk flags,
Global search, Mobile CEO mode, seeds réalistes, tests, CI, documentation.

## Livré depuis (itérations suivantes)

- **Détection automatique des risk flags** + page Document Readiness (`/documents`).
- **Base de données réelle SQLite** (`better-sqlite3`) avec migrations versionnées et
  seeding automatique, derrière `Repository` (voir `docs/database.md`).
- **Couche d'écriture** : `WritableRepository` + server actions — création d'offres, de
  demandes, de deals (depuis un match) et de devis (avec Margin Guard serveur autoritaire).

## Dette volontaire (reportée en connaissance de cause)

1. **Base de production managée** (Postgres) pour l'hébergement serverless : réimplémenter
   `SqliteRepository` derrière la même interface (aucun changement UI/moteurs).
2. **Authentification / RBAC** externe.
3. **Édition/suppression** avancée (la création est faite ; update se limite à l'étape du deal).
4. **Tests E2E Playwright** (login, création offre/demande/devis/deal) : la logique et la
   persistance sont couvertes en unitaire ; les E2E navigateur restent à ajouter.
5. **Corridor RDC avancé** : volontairement minimal en V1 (aucun workflow sensible).

## Vérifications exécutées

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ |
| `npm test` (Vitest) | ✅ 62 tests |
| `npm run build` | ✅ 15 routes |
| `npm run seed` | ✅ dashboard parlant |
| Smoke test HTTP (13 routes) | ✅ toutes en 200 |
