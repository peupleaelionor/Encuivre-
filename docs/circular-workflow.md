# Flux CIRCULAR (rachat & valorisation)

## Objectif

Racheter des chutes propres (cuivre, laiton, bronze, aluminium) à faible capital, et les
réinjecter dans le flux Trade — **sans que le dirigeant fasse lui-même la manutention**
quand elle peut être externalisée.

## Sources (provenance)

- `LOCAL_SCRAP` — chutes d'électriciens, plombiers / CVC, métalliers.
- `INDUSTRIAL_OFFCUT` — plaques hors-format, tubes courts, chutes de barres, fils,
  méplats, surplus de production. **Stratégiques pour démarrer avec moins de capital.**

Ces deux provenances sont marquées `lowCapital` dans le domaine (`lib/enums.ts`,
`LOW_CAPITAL_PROVENANCES`) et mises en avant dans `/buy-opportunities`.

## Étapes

1. **Identifier une source** — un fournisseur/`SellOffer` avec provenance `LOCAL_SCRAP`
   ou `INDUSTRIAL_OFFCUT`.
2. **Qualifier** — matière, grade, quantité, prix, documents (facture au minimum).
3. **Décider l'achat** — via `/buy-opportunities` (`lib/buy-opportunities.ts`) :
   BUY seulement s'il existe une **demande réelle** ou une **rotation** + prix intéressant
   + risque maîtrisé. Sinon WATCH ou AVOID, toujours justifié.
4. **Externaliser la logistique** — la manutention/transport est un coût du landed cost,
   pas une tâche du PDG.
5. **Valoriser** — la matière rachetée alimente les offres du flux Trade.

## Principe dirigeant

Le PDG ne doit pas devenir manutentionnaire. Le logiciel calcule, classe et alerte ; la
manutention s'externalise dès que possible et son coût entre dans la marge.
