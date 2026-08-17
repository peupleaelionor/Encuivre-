# Base de données & couche d'écriture

## Choix technique

EN CUIVRE OS utilise **SQLite via `better-sqlite3`** (pilote **synchrone**). Ce choix
préserve l'interface `Repository` synchrone : l'UI et les moteurs métier n'ont pas eu à
être convertis en asynchrone. Aucun serveur externe n'est requis ; la base est un simple
fichier, ce qui garde la CI fiable.

## Emplacement de la base

- Variable d'environnement **`ENCUIVRE_DB_PATH`** (ex. `:memory:` en test).
- Sinon `<cwd>/data/encuivre.db` (créé automatiquement, ignoré par git).

## Migrations

- Migrations versionnées dans `lib/db/migrations.ts` (constantes TS embarquées pour
  fonctionner dans le bundle serveur Next). Miroir lisible : `lib/db/migrations/*.sql`.
- Le runner (`lib/db/connection.ts`) enregistre les migrations appliquées dans
  `_migrations` et applique les manquantes dans l'ordre, chacune dans une transaction.
- **Ajouter une migration** : pousser un nouvel objet `{ id, sql }` (id incrémental) —
  ne jamais éditer une migration déjà appliquée.

## Seeding

Au premier accès, si la table `companies` est vide, la base est **peuplée** depuis le
dataset typé `lib/seed` (`lib/db/seed-db.ts`). Les dates du seed sont relatives, donc une
base fraîche est toujours « parlante ». La base étant regénérée quand elle est absente, un
`rm -rf data` suffit à repartir d'un état de démo propre.

## Modélisation

Colonnes scalaires et clés étrangères **normalisées** ; les objets valeur (metrics,
mémoire contact, incoterms) et les petits tableaux de chaînes (materials, grades,
documents, riskFlags) sont stockés en **JSON TEXT**. C'est un équilibre documenté — pas
« du JSON pour tout » (voir CLAUDE.md). Le mapping pur vit dans `lib/db/mappers.ts`.

## Couche d'écriture

`WritableRepository` (`lib/store.ts`) expose des écritures explicites, implémentées par
`SqliteRepository` (`lib/db/repository.ts`) :

- `createSellOffer`, `createBuyRequest`, `createDeal`, `createQuote`, `createDecision`
- `updateDealStage`

Elles sont appelées via des **server actions** (`app/actions.ts`, `"use server"`) :

| Action | Déclencheur UI | Effet |
|---|---|---|
| `createSellOfferAction` | `/offers/new` | Crée une offre, revalide, redirige vers `/quick-sales`. |
| `createBuyRequestAction` | `/requests/new` | Crée une demande. |
| `createDealFromMatchAction` | Bouton « Créer un deal » (`/quick-sales`) | Crée un deal QUALIFIED depuis un match. |
| `saveQuoteAction` | « Enregistrer le devis » (`/quotes/new`) | **Recalcule le devis et le Margin Guard côté serveur** (autorité) ; refuse si la marge est insuffisante. |
| `promoteDealAction` | (interne) | Change l'étape d'un deal. |

Les calculs financiers sont **re-exécutés côté serveur** dans `saveQuoteAction` : le client
ne fait jamais autorité sur la marge.

## Production

`better-sqlite3` écrit sur un fichier local — parfait en dev, CI et déploiement sur serveur
persistant. Sur un hébergement **serverless** au système de fichiers éphémère/lecture seule
(ex. Vercel), remplacer l'implémentation par une base gérée (Postgres) en réécrivant
`SqliteRepository` derrière la même interface `WritableRepository`. Le reste de l'appli est
inchangé.
