# Contrôles de risque & sécurité

## Philosophie

Le logiciel **prépare** la décision de risque et **force la revue humaine** quand il le
faut. Il ne prétend pas remplacer un contrôle de conformité réel.

## Risk flags structurés (`lib/enums.ts` → `RISK_FLAGS`)

`UNVERIFIED_COMPANY`, `PRICE_TOO_GOOD`, `BANK_ACCOUNT_CHANGED`, `MISSING_ORIGIN`,
`MISSING_COA`, `INCONSISTENT_QUANTITY`, `PAYMENT_TOO_EARLY`, `DOCUMENT_EXPIRED`,
`SANCTIONS_REVIEW_REQUIRED`, `MANUAL_REVIEW`.

`requiresHumanReview()` (`lib/risk.ts`) force une revue humaine pour les flags bloquants
(sanctions, changement de compte bancaire, revue manuelle, document expiré).

### Détection automatique — `deriveRiskFlags()`

`deriveRiskFlags()` (`lib/risk.ts`) dérive des flags **explicables** depuis une offre /
un deal / une société :

- `UNVERIFIED_COMPANY` — contrepartie non vérifiée.
- `PRICE_TOO_GOOD` — prix < 70 % de la référence marché (`lib/market.ts`) : signal de fraude.
- `MISSING_COA` / `MISSING_ORIGIN` — documents requis absents (matière raffinée / flux transfrontalier).
- `INCONSISTENT_QUANTITY` — quantité ≤ 0 ou au-delà de la capacité fournisseur.
- `DOCUMENT_EXPIRED` — un document rattaché est expiré.
- `MANUAL_REVIEW` — pays inconnu, **ou** corridor Congo (V1) avec contrepartie non vérifiée.

Le moteur ne **fabrique jamais** une correspondance de sanctions : `SANCTIONS_REVIEW_REQUIRED`
n'est conservé que s'il a déjà été posé manuellement sur le deal. Le CEO Command Center
affiche « Revue humaine requise » pour les deals ouverts concernés ; l'état documentaire
est visible sur `/documents`. Les prix de référence (`lib/market.ts`) sont des ancrages
grossiers, **jamais** une source de vérité financière.

## Sanctions screening — NON implémenté (volontairement)

**Aucune** solution automatique de screening de sanctions n'est fournie. Le flag
`SANCTIONS_REVIEW_REQUIRED` ne fait que **router vers une revue humaine**. Ne jamais
présenter une correspondance automatique comme un contrôle de sanctions fiable.

## Règles métier de protection (testées)

- **Fournisseur `BLOCKED`** : jamais utilisable dans un match ou une opportunité d'achat
  (`matching.ts`, `buy-opportunities.ts`).
- **Margin Guard** : marge négative ⇒ validation impossible ; sous plancher ⇒ RED ;
  sous cible ⇒ AMBER avec avertissement. Seuils configurables via variables d'env.
- **Buyer before inventory** : pas de recommandation d'achat à l'aveugle.
- **Document readiness** : alertes d'expiration (`documentExpiryAlerts`).

## Audit de sécurité (état V1)

| Domaine | État V1 | Note |
|---|---|---|
| Auth | Reporté (dette volontaire) | Outil mono-opérateur ; RBAC modélisé (`ownerId`). |
| Autorisation serveur | N/A en lecture seule | À ajouter avec l'écriture (V2). |
| Validation des entrées | Quote Builder valide/normalise les nombres | Étendre à toute écriture V2. |
| Secrets | Aucun secret requis en V1 | `.env.example` documente les seuils publics. |
| Données bancaires | **Non stockées** | Conforme à la consigne V1. |
| Données financières côté client | Calculs de marge côté client dans le Quote Builder | Acceptable (outil interne, pas de secret). |
| Dépendances | `next` mis à jour vers version patchée (CVE-2025-66478) | `npm audit` : reste des alertes dev (eslint/build), pas de secret exposé. |
| Fuite d'erreurs | Pas de stack exposée à l'utilisateur | Pages simples. |
| ORM/SQL | Aucun (dataset typé) | Le futur ORM devra utiliser des requêtes paramétrées. |

## Risques encore ouverts

1. Pas d'authentification externe (reporté).
2. Écriture non persistée : pas encore de surface d'attaque d'écriture, mais aussi pas de
   contrôle d'autorisation à ce niveau — à concevoir **avant** d'ajouter l'écriture.
3. `npm audit` signale des vulnérabilités transitives côté outillage dev — à réévaluer à
   chaque montée de version ; elles n'affectent pas le runtime de production servi.
