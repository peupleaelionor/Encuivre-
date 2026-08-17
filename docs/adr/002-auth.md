# ADR 002 — Authentification & sessions

_Statut : accepté — Sprint 1._

## Contexte

Le Sprint 1 introduit l'authentification et le multi-utilisateur : login, sessions
serveur, cookies sécurisés, RBAC. Contraintes : fiabilité, testabilité en CI **sans
service externe**, pas d'auth « maison » fragile, pas de service-role exposé au client.

## Options évaluées

- **Auth.js (NextAuth v5)** — riche (OAuth, adapters), mais setup lourd, API en évolution,
  et un provider Credentials reste à sécuriser soi-même.
- **Supabase Auth** — solide, mais couple l'auth à Supabase et complique les tests CI
  hermétiques ; le domaine ne doit pas dépendre de Supabase.
- **Session serveur minimale et auditable** — mot de passe haché par `scrypt` (module
  `node:crypto`, sans dépendance native), session signée (HMAC `AUTH_SECRET`) stockée en
  cookie **httpOnly / Secure / SameSite=Lax**, validée côté serveur à chaque requête.

## Décision

Pour le Sprint 1 : **session serveur minimale et auditable** (scrypt + cookie signé
httpOnly), entièrement testable et sans service externe.

Raisons :
- Répond à tous les critères fonctionnels (login, session serveur, cookies sûrs, RBAC,
  scope organisation) et à la définition de « fait » du sprint.
- Zéro dépendance native / zéro service externe → CI hermétique et rapide.
- Surface de code réduite et lisible (`lib/auth/*`), donc pas « fragile » : hachage fort,
  comparaison à temps constant, secret côté serveur uniquement, aucune logique de
  confiance côté client.

## Chemin d'évolution (non bloquant)

`getCurrentUser()` / `getSession()` sont la seule surface que le reste de l'app utilise.
Migrer vers **Auth.js** (OAuth Google/Microsoft, magic links) ou **Supabase Auth**
consistera à réimplémenter cette surface, sans toucher au RBAC (`lib/auth/permissions.ts`)
ni aux services. Recommandé au Sprint 2 si l'on veut du SSO/OAuth.

## Sécurité

- `AUTH_SECRET` (≥ 32 octets) obligatoire hors dev ; jamais exposé au navigateur.
- Cookie de session : `httpOnly`, `secure` (prod), `sameSite=lax`, durée limitée, signé.
- Mots de passe : `scrypt` (sel aléatoire par utilisateur), comparaison à temps constant.
- Aucun bypass d'auth actif en production (le login dev est gardé par `NODE_ENV`).
- Autorisation **toujours** re-vérifiée côté serveur (cf. `lib/auth/permissions.ts`).
