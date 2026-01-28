# AssureQai Platform – Project Overview

A high-level map of the monorepo: what lives where, how the pieces fit, and how to run the main services.

## Stack at a Glance
- Monorepo: Nx (workspace config in nx.json, tsconfig.base.json)
- Backend: NestJS (apps/api-gateway)
- Frontend: Next.js (apps/client-portal, apps/admin-portal)
- Data: MongoDB, Redis (see docker-compose.yml)
- Auth/queues: JWT, Bull, Socket.IO
- Styling: TailwindCSS, Radix UI, custom components

## Apps (apps/)
- api-gateway: NestJS API for audits, users, campaigns, credits, webhooks; see project.json and webpack.config.js for build/serve.
- client-portal: Next.js client dashboard (14 pages noted in README), runs with nx dev client-portal.
- admin-portal: Next.js super-admin portal, runs with nx dev admin-portal.
- api-gateway-e2e: E2E test harness for the API (Cypress/Jest harness via Nx target definitions).
- landing: Marketing/landing Next.js site (separate app).

## Shared Libraries (libs/)
- auth: Shared authentication helpers, guards, DTOs used across apps.
- common: Cross-cutting utilities, models, and UI/shared logic (imported by multiple apps).

## Infrastructure (infrastructure/)
- ansible/: Playbooks, inventory, and templates for provisioning servers.
- terraform/: IaC definitions for cloud resources.
- nginx.conf: Reverse proxy config used by Docker profile with Nginx.

## Docs (docs/)
- DEPLOYMENT_OPTIONS.md: Deployment guidance.
- Additional how-to and troubleshooting guides under docs/ (CI/CD, SMTP, audio upload, etc.).

## Root Config & Tooling
- docker-compose.yml: Spins up MongoDB, Redis, API, portals, and optional Nginx.
- .env.example / .env.local: Environment variables template for all services.
- eslint.config.mjs, prettier configs: Linting/formatting.
- jest.config.ts, jest.preset.js: Test runner configuration.
- .github/workflows/: CI/CD and security checks.

## Data & Runtime Notes
- Mongo collections/schemas defined under apps/api-gateway/src/database/.
- Redis used for caching and queues (Bull) via api-gateway.
- Static assets for portals live under each app’s public/ directory.

## Runbook (local)
1) Install: npm install
2) Backend: npx nx serve api-gateway
3) Client portal: npx nx dev client-portal (new terminal)
4) Admin portal: npx nx dev admin-portal (new terminal)
5) Alt: docker-compose up -d (use profile with-nginx for reverse proxy)

## Environments
- Development: uses local .env.* files and Nx serve/dev targets.
- Production: build with docker-compose (copy .env.example to .env and adjust), optionally fronted by Nginx.

### Separate DB per client (high level)
- Provision: create a MongoDB database (and user) per client; keep credentials isolated.
- Config: store per-client connection strings in the instance record or env/secrets store; API Gateway must resolve the correct URI per request (e.g., by instanceId/clientId).
- Migrations/indexes: run schema init on each database when an instance is created (ensure indexes are applied once per DB).
- Caching/queues: keep Redis shared but namespace keys by client; or run separate Redis if isolation is required.
- Backups: schedule per-database backups and label with client identifiers; align retention per contract.
- Observability: tag logs/metrics with client to trace per-DB operations; alert per tenant.

## Where to Start
- Quick start and feature list: README.md
- API definitions and DTOs: apps/api-gateway/src/
- UI pages: apps/client-portal/src/ and apps/admin-portal/src/
- Shared logic: libs/
- Deployment choices: docs/DEPLOYMENT_OPTIONS.md
