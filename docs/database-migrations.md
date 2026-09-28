# Database migrations

The app uses MongoDB, so records live in collections and documents rather than relational tables and columns. Each structural or repeatable data change belongs in a migration. The migration runner records completed migrations in `_schema_migrations` and skips them on later runs.

## Run migrations

For local testing, `npm run migrate` loads the active `MONGODB_URI` from `.env.local`. Confirm that file points to the testing cluster before running the command.

For production, run the same command in an environment where `MONGODB_URI` is set to the Vercel **Production** database URI. An already-set environment variable takes precedence over `.env.local`. Keep the production URI out of source control and command history.

Run migrations against testing first, review the result, then run them against production as a deliberate release step. A normal Vercel code deployment does not run migrations automatically.

## Add a migration

1. Add the next zero-padded migration file in `src/scripts/migrations/`, exporting a unique `id`, a `description`, and an `up(db)` function.
2. Add that migration to the ordered list in `src/scripts/migrations/index.ts`.
3. Make the operation safe to retry when possible. Do not edit a migration after it has been applied; add a new migration to correct or extend it.
4. Run `npm run migrate` on testing, then use the same command with the production URI after review.

Existing indexes are captured as `001_initial_indexes`. This migration is safe to apply on a database that already has the same indexes.
