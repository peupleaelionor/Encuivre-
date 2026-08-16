# Modèle économique — EN CUIVRE

## Principe central

EN CUIVRE gagne principalement un **spread / une commission** en rapprochant un
**fournisseur** et un **acheteur** de cuivre et d'alliages, **sans immobiliser
inutilement de capital**. La règle d'or : **on cherche l'acheteur avant d'acheter la
matière** (« buyer before inventory »).

Le logiciel matérialise ce principe : le module `/buy-opportunities` refuse de
recommander un achat spéculatif ; il exige une demande réelle, une rotation historique,
un prix intéressant et un risque maîtrisé (BUY / WATCH / AVOID).

## Lignes métier

| Ligne | Rôle | Priorité | Capital |
|---|---|---|---|
| **TRADE** | Négoce B2B fournisseur ↔ acheteur | 1 (moteur) | Faible si buyer-first |
| **CIRCULAR** | Rachat/valorisation de chutes | 2 | Faible, sourcing local |
| **ATELIER** | Premium (gravure, séries limitées) | 3 | Faible, marge + branding |
| **HOUSE** | Showroom / e-commerce / image | 4 | Vitrine, pas moteur unique |
| **CONGO** | Corridor RDC ↔ France ↔ Europe | 5 (progressif) | Élevé, à sécuriser |

## Matières

**Prioritaires (MVP opérationnel)** :
1. Copper Cathode Grade A
2. Copper Millberry (recyclé propre)
3. Copper bars / busbars
4. Copper tubes
5. Copper sheets / plates
6. Brass (laiton)
7. Bronze
8. Aluminium

**Présentes mais non promues** : Tin (étain), Cobalt — dans le modèle de données
uniquement, jamais mises en avant dans l'UI/matching/achat en V1.

## Économie d'un deal Trade

```
Prix de vente (rendu)
  − Coût d'achat matière
  − Transport
  − Assurance
  − Douane / frais
  − Financement (coût du capital immobilisé)
  − Autres coûts
= Marge brute (€ et %)
```

Calcul fiable en centimes entiers (`lib/pricing.ts`), verdict de sécurité par le
**Margin Guard** : GREEN (≥ cible), AMBER (sous cible, avertissement), RED (marge
négative ou sous plancher ⇒ **validation bloquée**). Seuils configurables.

## Sourcing à faible capital

`Provenance` distingue : `LOCAL_SCRAP`, `INDUSTRIAL_OFFCUT`, `DISTRIBUTOR`, `REFINERY`,
`TRADER`, `DIRECT_PRODUCER`. Les **chutes industrielles** (plaques hors-format, tubes
courts, chutes de barres, fils, méplats, surplus) et les **chutes locales** sont marquées
`lowCapital` : stratégiques pour démarrer avec moins de trésorerie.

## Ce que le PDG doit toujours savoir (résumé opérationnel)

1. Quoi faire — `/ceo`, `/focus`.
2. Avec qui — `/contacts`, `/suppliers`, `/buyers`.
3. Combien ça peut rapporter — marges partout, `/quotes/new`.
4. Quel est le risque — Margin Guard, risk flags, scores.
5. Quelle est la prochaine action — follow-up engine, `nextAction`.
