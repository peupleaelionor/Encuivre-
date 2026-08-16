# Flux TRADE (priorité n°1)

## Objectif

Rapprocher un **fournisseur** et un **acheteur**, sécuriser la marge, et signer — en
immobilisant le moins de capital possible.

## Étapes

1. **Capturer la demande** — une `BuyRequest` (matière, grade min, quantité, prix cible,
   géographie, échéance).
2. **Capturer l'offre** — une `SellOffer` (matière, grade, provenance, quantité, prix/t,
   localisation, documents disponibles, disponibilité).
3. **Matcher** — `/quick-sales` (`lib/matching.ts`) :
   - filtres durs : même matière, grade compatible, **fournisseur non BLOCKED** ;
   - facteurs : volume, géographie, prix/marge, documents, scores buyer/supplier ;
   - sorties : volume mobilisable, coût & prix indicatifs, marge brute (€ et %),
     **score de compatibilité** (0–100) et **score de risque** (0–100).
4. **Chiffrer** — `/quotes/new` (`lib/pricing.ts`) : landed cost complet + marge visée
   ⇒ prix de vente, marge brute (€/%).
5. **Contrôler la marge** — Margin Guard (`lib/margin-guard.ts`) : GREEN/AMBER/RED.
   Marge négative ou sous plancher ⇒ passage en QUOTED/CONTRACT **bloqué**.
6. **Prioriser** — Deal Priority Score (`lib/deal-score.ts`) alimente `/focus` et
   « À faire aujourd'hui » sur `/ceo`.
7. **Relancer** — Follow-up engine (`lib/follow-ups.ts`) : Today / Overdue / 7 jours /
   Sans activité + alertes (offre sans réponse, contrat non signé, documents manquants,
   client dormant, fournisseur non relancé).
8. **Documenter & signer** — suivi documentaire (COA, Assay, Origin, Contract, Invoice,
   Packing List, B/L) avec statuts de vérification et alertes d'expiration.

## Étapes du deal (`DealStage`)

`LEAD → QUALIFIED → QUOTED → NEGOTIATION → CONTRACT → WON` (ou `LOST`).

## Garde-fous

- Un **fournisseur BLOCKED** n'apparaît jamais dans un match ni dans une opportunité d'achat.
- Un **acheteur RISK** (paiement peu fiable) est signalé et augmente le score de risque.
- Le **Margin Guard** empêche toute validation à perte.
- Les **risk flags** structurés forcent une revue humaine quand nécessaire
  (voir `docs/risk-controls.md`).
