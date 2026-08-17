# Protection de branche & CI

## Objectif

Garder `main` toujours vert et déployable. Les status checks CI ont des **noms stables**
pour pouvoir être exigés comme « required checks » sur une branche protégée.

## CI (`.github/workflows/ci.yml`)

Un job **`ci`** exécute, dans l'ordre :

1. `npm ci` — installation reproductible.
2. `npm run lint` — ESLint.
3. `npm run typecheck` — TypeScript.
4. `npm test` — tests unitaires (Vitest).
5. `npm run build` — build de production.

Le nom du check requis à configurer est : **`ci`** (job `ci` du workflow `CI`).

> Tests E2E : lorsqu'ils seront ajoutés (Playwright), les mettre dans un **job séparé**
> `e2e` pour ne pas fragiliser le check `ci` principal, et ne l'exiger que s'il est stable.

## Recommandations de protection pour `main`

Dans **Settings → Branches → Branch protection rules** (ou Rulesets) :

- ✅ **Require a pull request before merging** (PR obligatoire, pas de commit direct).
- ✅ **Require status checks to pass before merging** → cocher **`ci`**.
- ✅ **Require branches to be up to date before merging**.
- ✅ **Require conversation resolution before merging**.
- ✅ **Do not allow force pushes** sur `main`.
- ✅ **Do not allow deletions** de `main`.
- ✅ **Require approvals: 1** si l'équipe compte plus d'une personne (sinon optionnel).
- ✅ **Include administrators** (appliquer les règles à tous).

## Convention de branches

- `main` : protégée, déployable.
- Branches de travail : `feat/*`, `fix/*`, `docs/*`, `chore/*` (ou branche assignée).
- Commits **petits et cohérents** (ex. `feat: add margin guard`).
