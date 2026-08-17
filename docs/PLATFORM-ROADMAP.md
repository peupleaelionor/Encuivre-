# Roadmap plateforme

Chaque sprint s'ajoute **autour du cœur métier** (trouver → qualifier → comparer →
décider → signer) sans le sacrifier. Le PDG garde un cockpit simple.

## Sprint 1 — DB / Auth / RBAC ✅ (ce sprint)

PostgreSQL réel (Drizzle + PGlite/Postgres), migrations, seed DB, sessions serveur,
organizations, memberships, RBAC centralisé, repository DB, services d'autorisation,
tests DB + permissions. CEO Command Center et Quick Sales lisent la base.

## Sprint 2 — Portails Buyer / Supplier + RFQ / RFO

Portails contrepartie scoping-safe (le fournisseur ne voit que ses offres ; l'acheteur
ses demandes). Flux RFQ (demande de prix) / RFO (offre) structurés. Écriture côté
portail (`ownerOrganizationId` = tenant contrepartie). Storage documentaire privé réel.

## Sprint 3 — Marketplace + External Leads + Radar

Découverte d'opportunités entre tenants, leads externes qualifiés, « radar » de prix et
de disponibilité. Toujours « buyer before inventory ».

## Sprint 4 — Deal Rooms + Documents + Traceability

Espaces de deal (parties multiples via `DealParty`), cycle de vie documentaire complet
(COA/Assay/Origin/B-L), piste d'audit et traçabilité de bout en bout.

## Sprint 5 — AI Copilot

Copilote via une **couche outils** au-dessus des services (jamais la base brute, jamais
source de vérité financière) : préparation d'appels, synthèse de risque, brouillons.

## Sprint 6 — Partenaires / referrals / automation

Programme partenaires, referrals, automatisations de relance/alerte. Concepts de
job/règle (inspiration n8n) **sans** intégration lourde en V1.

## Non-goals permanents (V1)

Trading auto argent réel, paiement matière, crypto/blockchain, marketplace coltan,
cobalt artisanal, achat d'or, Western Union, KYC « magique », scraping sauvage,
microservices, signature électronique, intégrations logistiques, e-commerce complet.
