# Nest

A private, phone-first home organizer for two: lists, to-dos, wish lists and
monthly finances in NOK. Installed from the browser to the home screen (PWA).

Live app: https://radekhm.github.io/nest-app/

## Stack

| Part | Choice |
| --- | --- |
| Frontend | React + TypeScript + Vite, installable PWA (`vite-plugin-pwa`) |
| Hosting | GitHub Pages, deployed by GitHub Actions on every merge to `main` |
| Backend | Supabase (Postgres with row-level security, Auth, Realtime, Edge Functions) |
| Tests | Vitest + Testing Library |

## Local development

```sh
cp .env.example .env.local
npm install
npm run dev
```

Checks run in CI on every pull request:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Database

Schema changes live in `supabase/migrations/` as numbered SQL files and are
reviewed in pull requests before they are applied to the Supabase project.

`supabase/tests/` runs every migration in an in-memory Postgres (PGlite) with
a small stand-in for Supabase's `auth` schema and checks the row-level
security rules for each kind of user. They run with `npm test`.

Edge Functions live in `supabase/functions/`. `admin` handles the actions that
need the secret key (creating accounts, setting passwords, disabling
accounts) and only answers signed-in admins.

## Secrets

`.env.production` holds only public values (the project URL and the
publishable key). Access to data is enforced by row-level security. The secret
key and the database password are never committed.

## Workflows

- **CI**: lint, type check, tests and build on every pull request.
- **Deploy**: builds and publishes to GitHub Pages on every push to `main`.
- **Keep Supabase awake**: calls `public.ping()` twice a week so the free
  project never pauses.
- **Back up the database**: weekly `pg_dump`, gzipped and encrypted with
  `BACKUP_PASSPHRASE`, kept 90 days as a workflow artifact. Needs the
  `SUPABASE_DB_URL` (Session pooler connection string) and `BACKUP_PASSPHRASE`
  repository secrets.
