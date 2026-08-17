# V2 — Architecture

## Vue d'ensemble

Plusieurs surfaces (site public futur, portail partenaire/contrepartie, app équipe/CEO)
convergent vers une **couche d'auth + RBAC**, puis des **services applicatifs** qui
appliquent l'autorisation, appellent les **moteurs métier purs** et lisent/écrivent via
le **Repository** vers **PostgreSQL**. Une éventuelle couche IA future parle **aux
services** (jamais directement à la base).

```mermaid
flowchart TD
  PUB[Public Site (futur)]
  PORTAL[Partner / Counterparty Portal]
  APP[Team / CEO App]

  PUB --> AUTH
  PORTAL --> AUTH
  APP --> AUTH

  AUTH[Auth + RBAC\nlib/auth/*] --> SVC
  SVC[Application Services\nlib/services/*] --> ENG
  SVC --> REPO
  ENG[Trade Engines (purs)\nlib/pricing, matching, scoring, risk] --> SVC
  REPO[Repository\nlib/store.ts + lib/db/*] --> PG[(PostgreSQL\nPGlite dev/test · Postgres prod)]

  AI[AI Copilot (futur)] -->|tool layer| SVC
  AI -. jamais .-x PG
```

## Principes

1. **Moteurs métier purs** (`lib/*`) — pricing, matching, scoring, risk. Aucune
   dépendance à l'ORM ni à l'auth ; ils reçoivent des données et retournent des
   décisions explicables (Sprint §15).
2. **Repository comme seule couture de persistance** (`Repository` / `WritableRepository`).
   `PostgresRepository` (Drizzle) l'implémente ; PGlite en dev/test, Postgres en prod.
3. **Services = frontière d'autorisation** (`lib/services/*`). Toute lecture/écriture
   sensible passe un `AuthContext` et vérifie `can(user, action, resource)` côté serveur.
4. **RBAC centralisé** (`lib/auth/rbac.ts`) — une seule fonction `can()`, une matrice de
   rôles, un scope par organisation. Pas de `if (role === …)` dispersés.
5. **Multi-tenant** — `Organization` = tenant/compte ; `Company` = société commerciale
   (contrepartie CRM). Un utilisateur appartient à une ou plusieurs organisations via
   `Membership` (rôle + statut). Voir `docs/adr/001` et `docs/database.md`.
6. **IA future → couche outils → services**. Jamais IA → base brute. Jamais LLM comme
   source de vérité financière.

## Sécurité (rappel)

- Session serveur signée (httpOnly), vérifiée au edge (middleware) **et** côté serveur.
- Secrets serveur uniquement (`AUTH_SECRET`, service-role éventuel). Jamais côté client.
- Autorisation re-vérifiée dans les services ; un bouton caché n'est pas une protection.
- Argent en centimes entiers ; Margin Guard bloque les marges négatives.

## Organization vs Company (décision §12)

- **Organization** = tenant / compte qui se connecte (INTERNAL = EN CUIVRE ; ou un
  fournisseur/acheteur/partenaire disposant d'un portail).
- **Company** = société commerciale suivie dans le CRM. Elle peut exister **sans** compte
  (prospect), et être **reliée** à une Organization (`accountOrganizationId`) le jour où
  la contrepartie obtient un portail.
- Chaque `Company`/`SellOffer`/`BuyRequest`/`Deal` porte un `ownerOrganizationId` (le
  tenant propriétaire de la donnée) pour le scoping.
