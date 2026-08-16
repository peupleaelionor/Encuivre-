# CEO Operating System — logique de décision

## Pourquoi le logiciel fonctionne ainsi

Le dirigeant a un temps et une charge mentale limités. Le rôle du logiciel est
d'**absorber la mémoire, le classement, le calcul et les alertes**, pour ne laisser au
PDG que la négociation, la décision et la signature.

Chaque écran répond à cinq questions : **quoi faire · avec qui · combien ça rapporte ·
quel risque · quelle prochaine action.**

## Deal Priority Score (`lib/deal-score.ts`)

`calculateDealPriorityScore()` retourne `{ score (0–100), level, reasons[] }`.
La logique n'est **pas cachée** : facteurs et poids sont explicites et configurables.

Facteurs positifs (pondérés) : marge, valeur du deal, probabilité de closing, qualité
acheteur, qualité fournisseur, complétude documentaire, urgence.
Pénalités : capital immobilisé, risque, inactivité.

Niveaux : `HOT ≥ 75`, `WARM ≥ 55`, `COOL ≥ 35`, sinon `COLD`.

> Réglage métier : la référence de « marge forte » est fixée à **10 %** car le négoce de
> métaux fonctionne sur des marges fines — 8–10 % de marge brute est déjà excellent.

## CEO Command Center (`/ceo`)

≤ 8 KPI : pipeline potentiel, marge potentielle, deals HOT, deals à relancer, acheteurs
actifs, fournisseurs stratégiques, volume demandé, volume disponible.

« À faire aujourd'hui » : ≤ 5 actions concrètes (action, société, valeur potentielle,
raison, échéance, bouton d'accès), classées par priorité de deal et échéances dépassées.

## Focus (`/focus`)

Exactement **3 priorités**, pas 25 tâches. Classées par le Deal Priority Score
(montant + marge + probabilité + urgence + risque de perdre le deal).

## Intelligence relationnelle

- **Fournisseurs** (`lib/supplier-score.ts`) : sous-scores (pricing, quality, reliability,
  availability, compliance, speed, communication, terms) ⇒ badge `STRATEGIC / PREFERRED /
  APPROVED / WATCH / BLOCKED`. Un `BLOCKED` est exclu de tout deal.
- **Acheteurs** (`lib/buyer-score.ts`) : volume, fréquence, fiabilité de paiement,
  vitesse de closing, marge générée, relation, récurrence ⇒ badge `VIP / ACTIVE /
  OCCASIONAL / DORMANT / RISK`.

## Contact Memory (`/contacts`)

Fiche ultra-courte et **structurée** (pas une zone de notes géante) : ce qu'il achète/vend,
volume habituel, dernière discussion, dernière objection, engagement, prochaine action.

## Follow-up engine (`/follow-ups`)

Aucun deal ne disparaît. Buckets Today / Overdue / 7 jours / Sans activité, + alertes
automatiques. Chaque opportunité porte `nextAction`, `nextActionAt`, `owner`, `priority`,
`lastContactAt`.

## Capitalisation (`/decisions`)

Journal de décisions (contexte, décision, justification, résultat attendu/réel, revue) —
pour capitaliser sur l'expérience du dirigeant.

## Mobile CEO mode

La barre mobile expose l'essentiel : **Today, Deals, Contacts, Devis** — sans exposer
toutes les fonctions internes.

## Principe UX

Pas de graphiques décoratifs, pas de métriques vanity, pas de pages vides. En cas de
doute entre ajouter une fonctionnalité et simplifier : **simplicité, fiabilité, rapidité
de décision**.
