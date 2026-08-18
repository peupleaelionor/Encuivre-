# Portails contrepartie (Sprint 2) — RFQ / RFO

Les contreparties (fournisseurs, acheteurs) disposent d'un **portail scoping-safe**
séparé de l'app interne CEO. Un fournisseur ne voit que **sa** société, **ses** offres
(RFO) et les deals qui le concernent ; un acheteur, **ses** demandes (RFQ). Les
**marges internes ne sont jamais exposées**.

## Terminologie

- **RFO** (Request For Offer) → une **`SellOffer`** soumise par un fournisseur.
- **RFQ** (Request For Quote) → une **`BuyRequest`** soumise par un acheteur.

Ces soumissions entrent dans le flux interne : elles apparaissent dans **Quick Sales**
côté EN CUIVRE, avec la règle inchangée « fournisseur BLOCKED jamais matché ».

## Isolation (défense en profondeur)

1. **Middleware (edge)** : le token de session porte un claim `int` (interne vs portail).
   Un utilisateur portail est **redirigé vers `/portal`** s'il tente une route interne
   (`/ceo`, `/suppliers`, …) ; un interne est redirigé hors de `/portal`. Aucune page
   interne n'est donc atteignable par un compte portail.
2. **Services (serveur)** : `getVisibleOffers/Requests`, `getPortalCompany`,
   `getVisibleDeals` filtrent par organisation ; `redactDealForPortal` retire coût
   d'achat, probabilité et marge. `createSellOfferFor` / `createBuyRequestFor` vérifient
   `can()` **et** que la contrepartie n'agit que pour **sa propre** société, en marquant
   l'`ownerOrganizationId` de son tenant.
3. **RBAC** : `SUPPLIER` peut `CREATE_OFFER` (pas `CREATE_REQUEST`) ; `BUYER` l'inverse ;
   ni l'un ni l'autre n'a `VIEW_INTERNAL_MARGIN`.

## Modèle d'ownership

- `Company.accountOrganizationId` relie une société CRM au tenant qui peut se connecter
  en son nom (portail).
- `SellOffer.ownerOrganizationId` / `BuyRequest.ownerOrganizationId` = tenant ayant
  soumis l'enregistrement (INTERNAL pour une saisie interne, l'org de la contrepartie
  pour une soumission portail).

## Comptes de démo

`contact@metalsud.example` (SUPPLIER · portail fournisseur) et
`achat@cableplus.example` (BUYER · portail acheteur), mot de passe `encuivre`.

## Reporté (Sprint 3+)

Cycle de négociation RFQ→devis→acceptation, notifications, upload documentaire réel
(storageKey), invitations d'utilisateurs de contrepartie. Voir `docs/PLATFORM-ROADMAP.md`.
