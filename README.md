# Fakumoya: Medusa foundation

This repository contains the official Medusa DTC starter: a Medusa v2 backend and Admin in `apps/backend`, and its Next.js storefront in `apps/storefront`. Docker Compose runs these alongside PostgreSQL and Redis. The starter seeds example European regions and products; these are development data, not Fakumoya's catalogue.

## Prerequisites

Install Docker with Compose. Node.js 22.23.4 or newer and npm are required for commands run outside Docker; run `npm ci` at the repository root to install the workspaces. Ports 8000, 9000 and 5173 must be available.

## Local setup

1. Create local environment files:

   ```sh
   cp .env.example .env
   cp apps/backend/.env.template apps/backend/.env
   cp apps/storefront/.env.template apps/storefront/.env.local
   ```

2. Set a strong URL-safe `POSTGRES_PASSWORD` in `.env` and use the same password in the backend `DATABASE_URL`. Replace both backend secret placeholders with different random values. Keep these files private.

3. Start the database, Redis, migrations and backend:

   ```sh
   docker compose up -d medusa
   docker compose logs -f medusa-migrate medusa
   ```

   The one-off migration service runs `medusa db:migrate`. On a new database the official starter's migration scripts also seed the store, regions, publishable key and demo products. Subsequent runs apply pending migrations; they do not replace existing store data. An earlier database can therefore retain the previous bakery-specific seed.

4. Create an Admin user. Replace the example email and supply a new password in your terminal:

   ```sh
   docker compose exec medusa npx medusa user -e you@example.com -p 'YOUR_NEW_PASSWORD'
   ```

   Open `http://localhost:9000/app` and sign in. Copy the publishable API key from Settings → Publishable API Keys. The password passed on the command line may appear in shell history; remove it from history or use a secure local workflow.

5. Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` to that key in both `.env` and `apps/storefront/.env.local`. Then build and start the storefront:

   ```sh
   docker compose up -d --build storefront
   ```

   Visit `http://localhost:8000`. To restart the entire configured stack later, run `docker compose up -d --build`. Public Next.js variables are embedded at build time, so rebuild the storefront if its key or backend URL changes.

Use `docker compose ps` and `docker compose logs -f medusa storefront` to check status. Stop services with `docker compose down`; named database and Redis volumes are retained. Existing volumes retain existing data and passwords: updating `POSTGRES_PASSWORD` alone does not change an existing PostgreSQL user password.

## Troubleshooting

- If migrations fail, check `docker compose logs medusa-migrate postgres` and verify the database password matches both local environment files.
- If the storefront cannot load regions, verify the key is linked to the default sales channel and is present in both local environment files, then rebuild the storefront. The Docker backend URL must resolve to `http://medusa:9000` from the storefront container.
- If Admin live reload fails, check that port 5173 is free. Admin and API use port 9000.
- To seed additional starter products, run `docker compose exec medusa npx medusa exec ./src/scripts/seed-demo-products.ts`. This adds demo data; it is not intended for a production catalogue.
- The existing `.env` files are ignored by Git. Never commit credentials.
