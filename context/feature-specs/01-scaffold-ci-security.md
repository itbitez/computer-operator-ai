# 01 — Scaffold, CI gates, Docker Compose, metadata-only logging, security headers

## Goal

Stand up the repository skeleton and — more importantly — **the enforcement mechanisms that
make the invariants mechanical rather than aspirational.** After this unit, a pull request
that leaks a secret, imports a vendor SDK outside its isolation module, logs a request body,
or breaks typecheck cannot be merged. No product logic ships here.

This unit exists because every control it installs is one that becomes painful to retrofit.
CSP after thirty units of UI means hunting accumulated inline scripts. A secret in git
history cannot be removed once pushed.

## Context

The repository currently contains only `AGENTS.md`, `CLAUDE.md`, `context/`, and a completed
`.gitignore`. There is no application code, no `package.json`, no CI.

Read before starting: `context/architecture.md` (stack table, isolation rule, system
boundaries, invariants 1–15, performance budgets) and `context/code-standards.md`.

Relevant open decisions: **none block this unit.** D1 affects the production hosting region,
not local scaffolding. Build everything against the local Docker stack.

**Framework versions:** your training data is older than what you will install. Check the
resolved versions after install and record the actual major versions in the progress tracker.
Do not assume API shapes from memory — particularly for Next.js config and ESLint flat config,
both of which have changed recently.

## Design decisions

- **Security headers live in the Next.js config, not nginx.** They are then version-controlled
  with the app and identical across every environment. nginx terminates TLS only.
- **CSP uses a per-request nonce** issued in middleware. `unsafe-inline` for scripts is not
  acceptable — it defeats the purpose of having a CSP at all.
- **Metadata-only logging is enforced by the type system,** not by a grep. The logger accepts
  a closed field set, so logging a request body is a compile error rather than a review
  finding. Compile-time beats convention.
- **The isolation rule is enforced by ESLint `no-restricted-imports`,** failing CI. Invariant 3
  is otherwise unenforceable by inspection alone.
- **Docker Compose covers Postgres, Redis, Next.js, and nginx.** The FastAPI worker service is
  Unit 07's — see non-goals.

## Implementation

### 1. Next.js application

- Scaffold Next.js with the App Router and TypeScript into the repository root (the project
  already has files — scaffold in place, do not create a nested folder).
- `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`,
  `noUnusedLocals`, `noUnusedParameters`. No `any` anywhere.
- Install Tailwind. **Leave the default theme** — tokens are Unit 02.
- Directory skeleton matching `architecture.md` § System boundaries, each with a
  `.gitkeep`: `src/app/api/`, `src/components/`, `src/lib/{services,validators,contracts}/`,
  `src/jobs/`, `src/db/`.
- Create empty isolation module stubs so the ESLint rule has real targets:
  `src/lib/{ai,storage,payments,notifications,queue,auth}/client.ts`. Each exports a
  `TODO` type only — no vendor imports yet.
- A single placeholder route rendering the app name. No styling, no product UI.

### 2. Security headers

In the Next.js config, applied to every route:

| Header | Value |
|---|---|
| `Content-Security-Policy` | nonce-based; `default-src 'self'`; no `unsafe-inline` for scripts; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | deny all except `microphone=(self)` — Unit 20 needs the mic |
| `X-Frame-Options` | `DENY` |

- Middleware generates a per-request nonce and makes it available to the document.
- `microphone=(self)` is deliberate: Unit 20's voice input needs it, and discovering that
  later would mean editing this header under pressure.
- If a required third party cannot run under the strict policy, you may ship
  `Content-Security-Policy-Report-Only` **for that directive only**, with a `TODO` naming
  what blocked it. Record it in the tracker. It must be resolved before launch, not left.

### 3. Metadata-only logging (invariant 4)

Create `src/lib/logging/logger.ts`:

- Export a logger accepting **only** this field set, typed as a closed interface:
  `timestamp`, `level`, `method`, `path`, `statusCode`, `durationMs`, `userId`,
  `requestId`, `entityType`, `entityId`, `errorCode`, `errorName`.
- **Excess property checking must reject anything else at compile time.** Passing a request
  body, command text, document content, or a raw error object is a type error.
- Never accept a free-form `message` that could carry interpolated user data. Use
  `errorCode` plus the fixed fields.
- Errors: log `errorName` and `errorCode`; the stack goes to the error tracker in Unit 29,
  never to the application log.
- JSON output, one object per line.
- Every request gets a `requestId` (generated in middleware) for correlation.

### 4. Isolation rule enforcement (invariant 3)

ESLint `no-restricted-imports`, failing CI:

- Vendor SDK package names — the model provider, object-storage client, bKash client,
  `bullmq`, `nodemailer`, the auth SDK — are **banned everywhere except their own
  `src/lib/<module>/` directory.**
- Ban `process.env` outside `src/lib/config/`. Environment access goes through one validated
  config module, so a missing variable fails at boot rather than at 2am in a request handler.
- The error message on each rule must name the module to import instead.

### 5. Environment configuration

- `src/lib/config/env.ts` — validate every environment variable with Zod at startup. Fail
  fast and loudly on a missing or malformed value.
- `.env.example` with every key **and no real values**. Committed.
- Confirm `.env` and `.env.*` are gitignored before writing either file.

### 6. Docker Compose

Services: `postgres` (16+, named volume), `redis` (7+, named volume), `web` (Next.js dev
with hot reload), `nginx` (reverse proxy to `web`).

- Volumes named to match the `.gitignore` entries (`postgres-data`, `redis-data`).
- Secrets come from `.env`, never inlined in the compose file.
- Postgres is **not** published to the host in the production compose profile — internal
  network only.
- A documented one-command start, verified from a clean checkout.

### 7. CI pipeline

GitHub Actions on every pull request. **Every job blocks merge; no `continue-on-error`.**

1. **Typecheck** — `tsc --noEmit`, zero errors
2. **Lint** — ESLint, zero errors *and* zero warnings
3. **Test** — the test runner; passes with the placeholder tests below
4. **Secret scan** — gitleaks across the full history, not just the diff
5. **Dependency audit** — fails on high or critical
6. **Gitignore guard** — a job that asserts `.env` is ignored, and fails if any `.env*`
   file other than `.env.example` is tracked. This is the check that would have caught
   the gap found on 2026-08-18

Also configure the host to require these checks before merging into `main`.

### 8. Placeholder tests

Enough to prove the harness runs and to lock the enforcement in place:

- The env validator rejects a malformed environment.
- The logger drops or rejects an unexpected field at runtime (compile-time is covered by
  typecheck; this proves it at runtime too).
- A smoke test that the placeholder route returns 200.

## Non-goals

Do not do any of these. Each belongs to a later unit, and doing it here means doing it
without its own spec.

- **No FastAPI worker service** — Unit 07 owns the worker, its Dockerfile, and the compose
  service. Leave the queue module a stub.
- **No design tokens, fonts, or Tailwind theme customisation** — Unit 02.
- **No i18n setup, no locale routing, no message catalogue** — Unit 03.
- **No UI components** beyond the single placeholder route — Unit 04.
- **No database schema, models, or migrations** — Unit 05. Postgres runs; nothing uses it.
- **No auth, sessions, middleware beyond the nonce and request ID** — Unit 06.
- **No vendor SDKs installed.** The isolation stubs stay empty.
- Do not add rate limiting here — it ships with auth in Unit 06.

## Security requirements

- `.gitignore` verified complete **before** `.env.example` or any config file is created.
- No real secret, key, or credential in any committed file — including compose files,
  CI workflows, and examples.
- Headers verified against a running server, not read off the config file.
- The isolation ESLint rule proven to actually fail: attempt a banned import, confirm CI
  rejects it, then remove the attempt.
- CSP proven to block inline script execution in a browser.

## Verification checklist

- [ ] `docker compose up` from a clean checkout starts Postgres, Redis, nginx, and the app; the placeholder route loads
- [ ] `tsc --noEmit` passes with zero errors
- [ ] ESLint passes with zero errors and zero warnings
- [ ] Tests pass
- [ ] **Headers verified on a live response** (`curl -I`): CSP with nonce, HSTS, nosniff, Referrer-Policy, Permissions-Policy with `microphone=(self)`, X-Frame-Options
- [ ] **An inline `<script>` is blocked by CSP in a real browser** — console shows the violation
- [ ] **Importing a banned vendor SDK outside its `lib/` module fails ESLint** — demonstrated, then reverted
- [ ] **`process.env` outside `lib/config` fails ESLint** — demonstrated, then reverted
- [ ] **Passing a request body to the logger is a compile error** — demonstrated, then reverted
- [ ] Booting with a missing required env var fails immediately with a message naming the variable
- [ ] `git check-ignore -v .env .env.local node_modules` confirms all ignored
- [ ] gitleaks runs over full history and reports clean
- [ ] The gitignore-guard CI job fails when a dummy `.env` is staged — demonstrated, then reverted
- [ ] Branch protection requires all CI jobs before merge into `main`
- [ ] Resolved major versions of Next.js, React, TypeScript, and Node recorded in the progress tracker
- [ ] `context/progress-tracker.md` updated

## Dependencies

None — this is the first unit. Blocks every other unit.

## Note on size

This unit is larger than most. If it runs long, the clean split point is after §5
(scaffold, headers, logging, isolation rule, env) — commit that, then take §6–8
(compose, CI, tests) as a second session. **Do not split by skipping the enforcement
mechanisms**; they are the reason the unit exists. If you split, record it in the tracker
as `01a` / `01b`.
