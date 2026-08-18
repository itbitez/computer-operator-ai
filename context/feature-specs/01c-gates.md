# 01c — Local environment and merge gates

## Goal

A one-command local stack, and a CI pipeline that makes it impossible to merge code which
fails typecheck, lint, tests, a secret scan, or the gitignore guard.

After this unit, the quality bar stops depending on anyone remembering to check.

## Context

01a and 01b are complete: the app runs, headers ship, the logger is type-enforced, and the
isolation lint rule is active.

Read first: `context/architecture.md` § Stack (hosting row) and invariant 13.

## Design decisions

- **The FastAPI worker is not included.** Unit 07 owns the worker, its Dockerfile, and its
  compose service. Compose here covers Postgres, Redis, the web app, and nginx only.
- **No `continue-on-error` anywhere.** A gate that can be skipped is not a gate.
- The gitignore guard exists because a real gap was found on 2026-08-18 — the project had
  `.gitignore` covering only `current-issues.md`, which would have let `.env` into history
  on the first `git add .`. This job makes that specific failure impossible to repeat.

## Implementation

### 1. Docker Compose

Services: `postgres` (16+), `redis` (7+), `web` (Next.js dev with hot reload), `nginx`
(reverse proxy to `web`).

- Named volumes matching the `.gitignore` entries: `postgres-data`, `redis-data`.
- All secrets come from `.env`. **Never inline a credential in the compose file.**
- In the production profile, Postgres is **not** published to the host — internal network
  only.
- Document the single start command in the README.

### 2. CI pipeline

GitHub Actions, on every pull request. **Every job blocks merge.**

1. **Typecheck** — `tsc --noEmit`, zero errors
2. **Lint** — ESLint, zero errors *and* zero warnings
3. **Test** — the runner, passing
4. **Secret scan** — gitleaks over **full history**, not just the diff
5. **Dependency audit** — fails on high or critical
6. **Gitignore guard** — asserts `.env` is ignored, and fails if any `.env*` file other than
   `.env.example` is tracked

### 3. Tests

Enough to prove the harness runs and to lock 01b's enforcement in place:

- The env validator rejects a malformed environment.
- The logger drops or rejects an unexpected field at runtime (compile-time is already
  covered by typecheck; this proves it at runtime too).
- A smoke test: the placeholder route returns 200.

### 4. Branch protection

Configure the host to require all six jobs before merging into `main`.

## Non-goals

- No FastAPI worker service — Unit 07
- No database schema or migrations — Unit 05; Postgres runs, nothing uses it
- No deployment pipeline — Phase 4
- No product tests beyond the three above

## Security requirements

- No credential in the compose file, the CI workflow, or any committed file.
- gitleaks scans full history, not only the current diff.
- The gitignore guard is proven to actually catch a staged `.env`.

## Verification checklist

- [ ] `docker compose up` from a clean checkout starts Postgres, Redis, nginx and the app
- [ ] The placeholder page loads through nginx
- [ ] `docker compose down` stops everything; data survives a restart via named volumes
- [ ] All three tests pass
- [ ] A pull request runs all six CI jobs and every one passes
- [ ] The gitignore guard **fails** when a dummy `.env` is staged — demonstrated, then reverted
- [ ] gitleaks reports clean over full history
- [ ] Branch protection requires all six jobs before merging into `main`
- [ ] No credential appears in any committed file
- [ ] `context/progress-tracker.md` updated — Phase 0 Unit 01 complete

## Dependencies

01a and 01b complete.
