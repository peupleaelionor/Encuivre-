# Open-source review

Étude d'inspiration — **idées** reprises, **jamais** copie aveugle ni dépendance lourde.
Aucune de ces bases n'est intégrée dans EN CUIVRE OS ; elles informent nos patterns.

## twentyhq/twenty — CRM

- **Licence** : AGPL-3.0 (copyleft fort). ⚠️ Une réutilisation de code impliquerait l'AGPL
  sur tout le produit — **à éviter**. On n'en reprend que des **idées**, pas de code.
- **Intérêt** : modélisation `Workspace` (≈ notre `Organization`), `WorkspaceMember`
  (≈ `Membership`), objets CRM personnalisables, timeline d'activité.
- **Repris (idées)** : séparation tenant/membre, timeline d'`Activity`, champs structurés
  plutôt qu'une note géante (déjà appliqué au Contact Memory V1).
- **Non repris** : moteur d'objets dynamiques, GraphQL, front lourd. Sur-dimensionné.
- **Risque de dépendance** : nul (aucune dépendance ajoutée).

## documenso/documenso — signature de documents

- **Licence** : AGPL-3.0 (cœur). Idées seulement.
- **Intérêt** : patterns d'auth (Auth.js), permissions par organisation, cycle de vie et
  statuts de documents, partage scoping-safe.
- **Repris (idées)** : statuts de vérification documentaire, permissions org-scopées,
  stockage privé (jamais public) — cadre notre `documents.storageKey` (Sprint 2).
- **Non repris** : signature électronique (non-goal V1), stack e-mail/PDF.
- **Risque de dépendance** : nul.

## medusajs/medusa — architecture modulaire

- **Licence** : MIT (permissive). Réutilisation possible, mais on ne reprend que le style.
- **Intérêt** : découpage en **modules de domaine**, patterns d'événements, services isolés.
- **Repris (idées)** : frontière **services** au-dessus du repository, moteurs de domaine
  purs, événements (`AuditEvent` / `Activity`) comme journal.
- **Non repris** : runtime modulaire complet, DI container, plugins — trop lourd pour l'MVP.
- **Risque de dépendance** : nul (inspiration architecturale).

## n8n-io/n8n — automatisation / règles

- **Licence** : Sustainable Use License (source-available, restrictions commerciales). ⚠️
  Ne pas intégrer comme dépendance produit.
- **Intérêt** : concepts de **jobs / règles / déclencheurs** pour de futures automatisations
  (relances, alertes).
- **Repris (idées)** : penser les alertes/relances comme des règles déclaratives (déjà
  amorcé dans `lib/follow-ups`), pour un futur moteur de règles (Sprint 3–6).
- **Non repris** : moteur de workflow, éditeur visuel, intégrations. Non-goal V1.
- **Risque de dépendance** : élevé si intégré → **exclu**.

## Synthèse

| Projet | Licence | On reprend | On n'intègre pas | Dépendance |
|---|---|---|---|---|
| twenty | AGPL-3.0 | idées tenant/membre, activity | code, GraphQL | non |
| documenso | AGPL-3.0 | idées auth/docs/permissions | signature élec. | non |
| medusa | MIT | style modulaire, services | runtime modulaire | non |
| n8n | SUL | concepts de règles | le moteur n8n | non |

**Règle** : les licences copyleft/à restriction (AGPL, SUL) interdisent la reprise de code
ici ; on n'en tire que des **patterns**. Aucune dépendance nouvelle n'est ajoutée par cette
revue.
