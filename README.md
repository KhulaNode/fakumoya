# Fakumoya Bakery powered by Medusa

This repository now runs the official Medusa v2 monorepo layout:

- `apps/backend`: Medusa backend and built-in Admin dashboard
- `apps/storefront`: official Medusa Next.js starter with catalogue, cart, checkout, customer accounts, addresses, and order history
- PostgreSQL and Redis via Docker Compose

## Local URLs

- Admin: http://localhost:9000/app
- Medusa API: http://localhost:9000
- Storefront: http://localhost:8000/za

Local Admin credentials:

```text
Email: admin@fakumoya.local
Password: FakumoyaAdmin9R2Lm8Zx4P
```

Change this password before sharing the environment. NetBird/Dokploy routing is intentionally not configured yet.

## Start the system

```sh
docker compose -f docker-compose.yml up -d --build
```

Compose starts PostgreSQL and Redis, runs `medusa db:migrate` (including the initial seed), then starts Medusa and the storefront. PostgreSQL and Redis have no published host ports.

The local Medusa service uses `medusa develop` so the built-in Admin is available reliably during local development. Production Dokploy mode should use a separately verified `medusa start` image and private Admin routing.

## Current scope

The Medusa commerce core is now running and serving the South African region, ZAR, the Seshego delivery location, product catalogue, cart, checkout, customer accounts, and order workflows. The seeded starter catalogue still needs to be replaced with Fakumoya's confirmed product data and images before launch. Paystack, subscriptions, commissions, bakery operations extensions, NetBird, and Dokploy production configuration remain subsequent implementation phases.

Do not commit `.env`, `apps/backend/.env`, or `apps/storefront/.env.local`.
