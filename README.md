# Computer Operator AI

A subscription-based, Bengali-first web platform that lets coaching center owners
generate, edit, and format `.docx` documents through written or voice commands in
natural Bengali, with payments via bKash.

## Prerequisites

- Node.js 24+
- Docker with Compose v2 (Compose v5 verified)

## Quick start (Docker, one command)

```bash
cp .env.example .env   # fill in credentials; .env is gitignored
docker compose up -d
```

Open <http://localhost> — nginx reverse-proxies to the Next.js dev server
(hot reload on) with Postgres 16 and Redis 7 alongside. Stop with
`docker compose down`; data survives via the named volumes `postgres-data` and
`redis-data` (only `down -v` destroys them).

### Production profile

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Postgres and Redis are **not** published to the host — internal network only;
nginx is the single host-facing entry point.

## Developing without Docker

```bash
npm ci
npm run dev
```

Runs the app on <http://localhost:3000> using the same `.env`. Stop any running
dev server before running the test suite (two dev servers cannot share `.next`).

## Quality gates

Every pull request runs six blocking CI jobs: typecheck, lint (zero errors and
zero warnings), tests, gitleaks secret scan over full git history, dependency
audit (fails on high/critical), and the gitignore guard. Locally:

```bash
npm run typecheck
npm run lint        # zero errors and zero warnings
npm run test        # vitest run
node scripts/check-gitignore.mjs
```

## Structure

- `src/` — Next.js app (routes, lib isolation modules, config)
- `tests/` — Vitest test suite (env validator, logger, smoke test)
- `scripts/` — merge-gate scripts
- `nginx/` — reverse proxy config
- `context/` — specs, architecture, progress tracker (read before contributing)
