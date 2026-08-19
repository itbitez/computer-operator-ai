# Progress Tracker

> The single source of truth for where this build stands. Updated after every unit.
> Agents: read this before anything else in `context/`.

**Last updated:** 2026-08-19 (Unit 01c built)

---

## Current phase

Phase 0 — Foundation. Scaffold, tokens, i18n, UI primitives, database, auth, worker
skeleton. Nothing built on a missing foundation survives the retrofit.

## Current goal

Implement Unit 01c (gates: Docker Compose, CI, branch protection). Specs for 01c and 02
are written.

## In progress

Nothing.

## Complete

- **Unit 01c — Gates** (2026-08-19): Docker Compose stack (postgres 16-alpine,
  redis 7-alpine, web with hot reload, nginx reverse proxy) verified end to end —
  page loads through nginx with all six headers intact, `down`/`up` cycle proven
  to preserve Postgres rows and Redis keys in the named volumes; production
  overlay removes host publishing (Postgres/Redis internal-only). CI pipeline
  with six blocking jobs (typecheck, lint at zero warnings, test, gitleaks over
  full history, `npm audit` failing on high/critical, gitignore guard) + branch
  protection on `main` requiring all six. Vitest harness with 9 tests (env
  validator malformed-env rejection, logger runtime field dropping, route smoke
  test against a real `next dev` server). Gitignore guard proven to fail on a
  staged dummy `.env`, then reverted. gitleaks clean over full history. PR #1
  (development → main) ran all six CI jobs green; branch protection requires them.

- **Unit 01b — Enforcement** (2026-08-18): six security headers verified against a
  running server (`curl -I`, dev and prod); nonce-based CSP from `src/proxy.ts` with the
  nonce proven applied to Next's inline scripts and proven to block a real inline script
  in headless Chrome (console violation, then reverted); metadata-only logger in
  `src/lib/logging/logger.ts` (closed field set, excess-property compile errors proven
  for a body/message/raw `Error`/stack, then reverted); per-request `x-request-id`
  (request + response) with one-line-JSON request logs; isolation ESLint rules —
  `no-restricted-imports` bans `groq-sdk`, `@aws-sdk/*`, any bkash-named package,
  `bullmq`, `nodemailer`, `next-auth` outside their `src/lib/<module>/` dirs, and a local
  `isolation/no-process-env` rule bans `process.env` outside `src/lib/config/` (both
  proven to fail on violating files, then reverted). `tsc --noEmit` and ESLint clean;
  prod build + `next start` verified.
- **Unit 01a — App skeleton** (2026-08-18): Next.js scaffold in repo root,
  strict tsconfig, Tailwind default theme, placeholder page, folder skeleton,
  six isolation stubs, Zod-validated env config with boot-time fail-fast.
  Specs written: 01b, 01c, 02.

## Blocked

| # | Blocked on | Blocking |
|---|---|---|
| D1 | Data residency (Cyber Security Act 2023 / Bangladesh Bank): must financial + document data stay in Bangladesh? Needs legal counsel. | Units 07 (worker skeleton prod config), 10 (notifications SMS vendor), 12 (bKash prod region) — dev proceeds on local/sandbox stack |
| D2 | Cross-border transfer to Groq + Groq DPA (no-training terms). Needs legal counsel + Groq contract review. | Unit 15 (AI client production vendor). Dev proceeds with Groq behind `lib/ai` |
| D3 | bKash contractual retention period for transaction records (5y assumed). Needs bKash agreement review. | Unit 30 (payment archive TTL final value) — config-driven, proceeds with default |
| D4 | Breach notification timelines under Cyber Security Act 2023 + bKash terms. Needs legal counsel. | Unit 34 (incident response runbook) |
| D5 | Legal classification of coaching documents (commercial IP vs "personal information"). Needs legal counsel. | ToS/Privacy wording linked from Unit 08 landing page |
| — | bKash merchant onboarding / sandbox credentials (external dependency, not a decision). | Unit 12 (payments integration) — build against mock bKash server meanwhile |

**Critical path:** D1 (hosting region before launch) and D2 (AI provider before launch).
Both insulated during development by the isolation modules. **Start bKash sandbox
onboarding now.**

---

## Unit plan

<!-- Numbers are stable identities, not positions. Never renumber.
     Specs are written just in time, not all up front. -->

### Phase 0 — Foundation
| # | Unit | State |
|---|---|---|
| 01a | App skeleton — Next.js scaffold, folder structure, isolation stubs, validated env config | ☑ spec ✓ |
| 01b | Enforcement — security headers (nonce CSP, HSTS, nosniff, referrer, frame-ancestors), type-enforced metadata-only logger, isolation ESLint rule | ☑ spec ✓ |
| 01c | Gates — Docker Compose (postgres/redis/web/nginx), CI pipeline (6 blocking jobs), branch protection | ☑ spec ✓ |
| 02 | Design tokens, self-hosted fonts, Tailwind theme | ☐ spec ✓ |
| 03 | i18n foundation (bn default, en fallback) | ☐ |
| 04 | UI primitives + axe-core in CI | ☐ |
| 05 | Database schema + migrations + append-only audit tables | ☐ |
| 05a | **Backup & restore** — automated Postgres backups, object-storage versioning, offsite copy, **restore actually performed** | ☐ |
| 06 | Auth backend (JWT, register/login, OTP, refresh rotation, server-side expiry checks) + **rate-limiter infrastructure and auth/OTP limits (per-user + per-IP)** | ☐ |
| 07 | Worker + queue skeleton (Node owns BullMQ → FastAPI HTTP, contract v1) | ☐ *prod region blocked by D1* |

### Phase 1 — Accounts & payments
| # | Unit | State |
|---|---|---|
| 08 | Landing page (public, i18n, ToS/Privacy links) | ☐ *ToS wording blocked by D5* |
| 09 | Registration + login UI (Bangla) | ☐ |
| 10 | Notifications module (SMS/email abstraction, console fallback) | ☐ *vendor blocked by D1* |
| 11 | Pricing page + plan display | ☐ |
| 12 | bKash payments backend (initiate, webhook signature, idempotency) | ☐ *blocked by sandbox onboarding* |
| 13 | Subscription lifecycle backend (scheduler, grace emails, expiry enforcement) | ☐ |
| 14 | Subscription & profile UI (read-only banner, renew, profile) | ☐ |

### Phase 2 — AI pipeline
| # | Unit | State |
|---|---|---|
| 15 | AI client module (Groq, Bengali system prompt, JSON schema validation, per-user quota) | ☐ *prod vendor blocked by D2* |
| 16 | DOCX generator (python-docx: contract JSON → .docx) | ☐ |
| 17 | Generate flow backend (enqueue, job status, SSE with ownership check) | ☐ |
| 18a | DOCX **parser** (Python worker: `parser.py`, .docx → contract JSON, 10k truncation flag) | ☐ |
| 18b | Upload backend (Node: type/size validation, ZIP-structure check, temp storage, calls 18a) | ☐ |
| 19 | Chat UI (thread, composer, progress, download cards) | ☐ |
| 20 | Voice input (Web Speech API, consent tooltip, error states) | ☐ |
| 21 | Edit/refine backend (context assembly, regenerate) | ☐ |
| 22 | Document history API (list, pre-signed download, soft delete) | ☐ |
| 23 | Document history UI (incl. restore during grace window, version list) | ☐ |

### Phase 3 — Admin
| # | Unit | State |
|---|---|---|
| 24 | Admin backend (user management, overrides — every action audited) | ☐ |
| 25 | Admin UI (audit-access dialog, admin pages, audit log viewer) | ☐ |
| 26 | Settings management (system prompt, plans, quotas, secret-flagged values) | ☐ |

### Phase 4 — Hardening
| # | Unit | State |
|---|---|---|
| 27 | Rate limiting + quotas — **generate/upload endpoints and AI per-user quota** (auth/OTP limits already shipped in Unit 06); tuning and abuse review | ☐ |
| 28 | Payment reconciliation job (daily, against bKash) | ☐ |
| 29 | Observability (p95/p99 metrics, slow-query log, error tracking) | ☐ |
| 30 | Retention & purge jobs (temp 24h, logs 90d, payment archive config) | ☐ *final TTL blocked by D3* |
| 31 | Accessibility pass (WCAG 2.1 AA audit + fixes) | ☐ |
| 32 | Load testing + budget verification (30 concurrent, ≤15s p95) | ☐ |
| 33 | Security hardening — dependency scan, webhook spoof/replay tests, secret rotation drill, **header verification against the deployed origin** (headers themselves shipped in Unit 01) | ☐ |
| 34 | Incident response runbook + breach plan | ☐ *blocked by D4* |

---

## Architectural decisions

<!-- Every decision made after setup lands here. This is what stops the same
     question being re-litigated in session twenty. -->

| Date | Decision | Reasoning |
|---|---|---|
| 2026-08-18 | Unit 01a ships Next.js 16.3.1 / React 19.2.8 / TypeScript 5.9.3 / Tailwind 4 / ESLint 9 / Zod 4.4.3, developed on Node 24.18.0 | Resolved majors recorded per spec; training data lags these |
| 2026-08-18 | Boot-time env validation via `src/instrumentation.ts` `register()`, which imports `lib/config/env.ts` | The spec requires validation "at module load" and a boot that fails naming the missing variable. `register()` is the only Next hook that runs on server start (dev and prod, not build); importing the module there makes the module-load validation happen at boot |
| 2026-08-18 | Layout props typed explicitly (`Readonly<{ children: React.ReactNode }>`) instead of the scaffold's generated `LayoutProps<"/">` | `LayoutProps` exists only after `next typegen`/`dev`/`build` generates `.next/types`, so `npx tsc --noEmit` fails on a clean checkout — exactly what the verification checklist runs. Explicit props keep the check green without a generated-types step; later units can adopt typed routes deliberately |
| 2026-08-18 | Env vars validated: `NODE_ENV`, `DATABASE_URL`, `REDIS_URL` only | Per spec ("start with only what exists now"); `NODE_ENV` is supplied by the Next CLI itself — `.env` cannot override it during `next dev`/`next start` |
| 2026-08-14 | Single VPS + Docker Compose (no Vercel) | Cross-region latency would break the 15s budget; one private network; survives the residency decision |
| 2026-08-14 | Node owns BullMQ; Python is a stateless HTTP worker | BullMQ is Node-first; Python BullMQ clients lag. Contract versioning absorbs the coupling |
| 2026-08-14 | JWT sessions, 15-min access / 7-day refresh | Stateless; revocation by re-checking `is_active` + expiry server-side on every protected route |
| 2026-08-14 | Manual renewal only, no bKash recurring agreements | Simpler integration, matches notification flow, familiar to users; auto-renew deferred as a future unit |
| 2026-08-14 | Expired users keep read-only access + data indefinitely (Option A) | Trust is the product in a word-of-mouth market; deletion only on self-delete (+30d grace) |
| 2026-08-14 | Cross-tenant reads return 404, not 403 | Never confirm existence (invariant 1); supersedes the earlier 403 wording in Phase 1 criteria |
| 2026-08-14 | Upload-and-edit limited to text/tables/basic styles, 10k-char parse cap, 5k-word output cap | python-docx reality + Groq context/latency budget; users split large documents into sections |
| 2026-08-14 | Bangla primary locale (`bn` default, `en` fallback), Bangla numerals in Bangla UI, AI system prompt in Bangla | Product is Bengali-first; mixed numerals read as unfinished |
| 2026-08-14 | Single-column chat layout even on desktop (max 768px), no documents sidebar | Conversation is the product; WhatsApp-familiar to the audience; history is a separate view |
| 2026-08-14 | Mobile number classified sensitive personal; documents/commands/chat = sensitive personal (commercial IP) | Payment-linked identifier; corpus leak is the existential business risk (Phase 2 worst-case) |
| 2026-08-14 | Groq output schema validated as untrusted input; per-user AI quota | Model output is untrusted data; quotas cap cost-burning attacks |
| 2026-08-18 | Auth/OTP rate limiting moved from Unit 27 into Unit 06 | A 6-digit OTP with no attempt limit is brute-forced in minutes. Shipping auth 21 units before its rate limiter left login and OTP exposed for the whole middle of the build — and live the moment anything reached a public staging URL |
| 2026-08-18 | Security headers moved from Unit 33 into Unit 01 | CSP costs ~10 lines at scaffold time. Retrofitting it after 30 units of UI means hunting every accumulated inline script and style, and the usual outcome is a permissive CSP that protects nothing |
| 2026-08-18 | Added Unit 05a — backup & restore, in Phase 0 | Criterion 11 and the read-only-forever decision promise indefinite durability, hosted on a single VPS. No unit created a backup, and Gate 3 requires restoring one. A disk failure would destroy every customer's commercial IP and the business with it |
| 2026-08-18 | Unit 18 split into 18a (Python parser) / 18b (Node upload) | `parser.py` is named in the architecture but no unit owned it. Unit 18 read as a Node unit, so the agent would have either attempted DOCX parsing in Node — wrong, `python-docx` is Python — or silently expanded scope across the language boundary |
| 2026-08-18 | Single VPS accepted for launch, with availability risk recorded (see Durability & availability in architecture.md) | The latency argument for one machine holds. The availability cost was previously unstated, which made it look overlooked rather than chosen. Mitigation is backup + tested restore (05a), not redundancy, until scale justifies it |
| 2026-08-18 | `spec-kit/` gitignored | Setup tooling, not application code. Keeping it tracked puts it in every diff and every agent file search |
| 2026-08-18 | `.gitattributes` added, forcing LF | `core.autocrlf=true` on Windows checks files out with CRLF. A shell script with CRLF fails inside a Linux container with `bad interpreter: /bin/bash^M` — hard to diagnose because the file looks normal. Unit 01c introduces Docker; this had to land first |
| 2026-08-18 | Unit 01 split into 01a (skeleton) / 01b (enforcement) / 01c (gates) | The single spec had 16 verification items across 8 concerns — roughly 2–3 hours. Agents degrade in long sessions, and degrading inside the unit that installs the safety mechanisms is the worst place for it. Split at coherent boundaries, not arbitrary size |
| 2026-08-18 | `text-muted` token darkened `#8A8A8A` → `#6E6E6E` | Original is 3.1:1 on `secondary-100` and 3.5:1 on white — below the 4.5:1 AA bar ui-context demands of itself. New value: 4.6:1 / 5.1:1. Applied to `ui-context.md` before Unit 02 ships |
| 2026-08-18 | New token `border-interactive` `#8C8C8C`; `border-light/medium/heavy` are decorative-only | All three existing borders are 1.4–1.8:1 on `secondary-100`; WCAG 1.4.11 needs 3:1 where a boundary identifies an interactive component. `#8C8C8C` measures 3.0:1 / 3.4:1 |
| 2026-08-18 | Colour values live once, as CSS custom properties in `globals.css`; Tailwind theme references `var(--color-*)` | Single source of truth; the verify script and tests parse the CSS. Works under both Tailwind v3 config and v4 `@theme`, so the theme survives whichever major Unit 01 installs |
| 2026-08-18 | CSP ships from `src/proxy.ts` (per-request nonce); the other five headers ship from `next.config.ts` `headers()` | A nonce is per-request, so CSP cannot live in the static config. Both are app code — the "not nginx" decision holds. The config applies to `/:path*`; the proxy matcher excludes only `_next/static`, `_next/image`, `favicon.ico`, and prefetches, so API routes also get the requestId and request log (the spec applies headers to every route) |
| 2026-08-18 | Dev and prod CSP differ in three dev-only relaxations: `'unsafe-eval'` in `script-src`, `'unsafe-inline'` in `style-src`, and no `upgrade-insecure-requests` | React dev uses eval for error-stack reconstruction; dev injects styles that cannot carry the nonce; upgrading a priori-insecure subresources breaks a plain-HTTP dev server. Production CSP has no `unsafe-inline` or `unsafe-eval` anywhere and includes `upgrade-insecure-requests`. These follow the official Next.js CSP guide's dev/prod split |
| 2026-08-18 | `page.tsx` opts into dynamic rendering via `await connection()` from `next/server` | Nonce CSP requires per-request SSR: statically built HTML is generated when no request headers exist, so Next could not stamp its inline scripts (`self.__next_f` etc.) with the nonce and the browser would block them. Build output confirms `/` is `ƒ` (dynamic) |
| 2026-08-18 | `process.env` ban implemented as a local flat-config rule `isolation/no-process-env` rather than `eslint-plugin-n` | The architecture names no ESLint plugin, and the ban is ~20 lines of rule code. `instrumentation.ts`'s `NEXT_RUNTIME` check moved into `src/lib/config/runtime.ts` so the ban has zero `eslint-disable` exceptions |
| 2026-08-18 | ESLint `no-restricted-imports` `patterns` (regex) bans: `groq-sdk`, `@aws-sdk/*`, any package name containing `bkash`, `bullmq`, `nodemailer`, `next-auth` — everywhere except `src/lib/{ai,storage,payments,notifications,queue,auth}/**` | Invariant 3 as a merge gate. bKash ships no official npm SDK (Unit 12 is raw HTTPS), so a bkash-name regex catches any community SDK; the SMS vendor is unresolved (D1), so its SDK joins the rule in Unit 10 alongside `nodemailer` — both per user decision on 2026-08-18 |
| 2026-08-18 | `x-request-id` (UUID) is set on both request and response headers by the proxy, and every proxied request is logged by the metadata-only logger | Correlation without touching the closed log schema: the requestId rides in the log line, the response header, and downstream via the request header |
| 2026-08-19 | Vitest 4.1.11 is the test runner (user decision 2026-08-19; architecture named none). Tests live in `tests/` at the repo root, not `src/` | The ESLint isolation rules (`no-restricted-imports`, `no-process-env`) scope to `src/**` — tests are not application code and need `process.env` to construct environments. Tests import app modules via the `@/` alias. Unit 02's spec assumes a runner exists; this is it |
| 2026-08-19 | Smoke test boots a real `next dev` on port 3123 (spawns `node next/dist/bin/next` directly — no `.cmd`/shell wrapper) and polls for 200 | Proves the actual server path, not a rendered component. It spawns with explicit test env values so it never depends on a real `.env`; a concurrently running dev server holds `.next`'s lock, so run tests with the dev server stopped |
| 2026-08-19 | Compose production shape is an overlay file (`docker-compose.yml` + `docker-compose.prod.yml` with `ports: !reset []`), not a `--profile` flag | Compose cannot conditionally remove a port mapping via profiles. The overlay is the canonical mechanism. `!reset` requires Compose ≥ 2.24 (machine runs v5.4) |
| 2026-08-19 | Dev publishes Postgres/Redis on `127.0.0.1` only; production publishes neither — applied to Redis as well as Postgres | The spec pins Postgres internal-only in production; Redis is the queue/rate-limit store and has the same exposure, so the spec's intent extends to it. Localhost-only binding even in dev is the safe default |
| 2026-08-19 | `WATCHPACK_POLLING=true` in the web compose service | Bind-mount file watching misses events on Windows/Docker; Next's own docs recommend polling there. Hot reload otherwise silently breaks |
| 2026-08-19 | Lint gate baked into the npm script (`eslint . --max-warnings=0`), not just CI | The bar "zero errors and zero warnings" should be identical locally and in CI; ESLint 9.39 supports `--max-warnings` |
| 2026-08-19 | Branch protection on `main`: six required status contexts (typecheck, lint, test, secret-scan, audit, gitignore-guard), strict, `enforce_admins`, no force-push/delete. **No review-approval requirement** | A solo account cannot approve its own PR, so `required_pull_request_reviews` would make merging impossible. Status checks + `enforce_admins` are the merge gates; PR discipline is process |
| 2026-08-19 | **Repo made public** (user decision, 2026-08-19) and `main` created from `development` (70f32ea) | GitHub Free blocks branch protection on private repos (403: "Upgrade to GitHub Pro"); protection needs an existing branch. Consequence accepted: the codebase and history are public — commit hygiene now has zero margin, which is what the six gates enforce |
| 2026-08-19 | gitleaks runs via `gitleaks/gitleaks-action@v2` with `fetch-depth: 0` in CI; locally verified via `docker run zricethezav/gitleaks` over the mounted repo | The spec requires scanning full history, not just the diff — shallow checkouts would scan only the PR's new commits |

## Declined baseline items

<!-- Security baseline items the project deliberately does not apply.
     Recorded so a reviewer sees a decision, not an oversight. -->

| Item | Reason |
|---|---|
| Malware scanning on uploaded `.docx` | DOCX is a ZIP/XML container; executable threats live in `.docm` (macros), which we never execute. Mitigation: content-type + ZIP-structure validation, 50 MB cap, documents are regenerated rather than executed, ToS disclaimer. Revisit if upload abuse appears. |

## Session notes

<!-- Anything a future session or a new developer needs and cannot infer from code:
     gotchas, version pins, non-obvious constraints, things that look wrong but aren't. -->

- `spec-kit/` in the repo root is a vendored copy of the setup skill — reference material,
  not part of the application. It is gitignored; keep the local copy so OpenCode can read it.
- `.gitignore` was completed on 2026-08-18 before any code landed. It had contained only
  `current-issues.md`, which would have let `.env` files — bKash credentials, JWT secrets,
  Groq keys, DB credentials — into git history on the first `git add .`. If you ever add a
  new secret-bearing file type, add it to `.gitignore` in the same commit.
- Unit numbers are stable identities. The 2026-08-18 resequencing used sub-numbers
  (`05a`, `18a`, `18b`) precisely so nothing already numbered had to move.
- Chrome's Web Speech API sends audio to Google's servers; the privacy criterion is
  disclosure + no server-side audio storage, not "audio never leaves the device."
- Voice transcription targets ≥ 70% accuracy with a "please type" fallback — that is the
  accepted bar, not a defect.
- Risk units to watch: 12 (bKash onboarding weeks), 16 (formatting fidelity = the
  product), 20 (Web Speech varies per Chrome build), 32 (15s budget may force trade-offs).
- The old repo branch is `development` with no commits; first real commit lands with
  Unit 01.
- Unit 02's spec was written before Unit 01 was built. It assumes Unit 01 shipped exactly
  its spec (Tailwind installed, test runner, CI workflow). If Unit 01 deviates on any of
  those, reconcile against `02-design-tokens-theme.md` and record it here.
- The spec-kit templates live in `~/.claude/skills/spec-kit/templates/` — the vendored
  `spec-kit/` folder named in earlier notes was gitignored and is not kept in the repo.
- `create-next-app` refuses to run in this repo root: "Computer Operator AI" is not a
  valid npm package name. Scaffold into a temp dir with a valid name, move the files in,
  and set `"name": "computer-operator-ai"` in package.json.
- Next.js 16 renamed `middleware.ts` to `proxy.ts` (`export function proxy`). Unit 01b's
  nonce CSP will live in `src/proxy.ts`; `middleware.ts` is deprecated with a codemod
  `npx @next/codemod@canary middleware-to-proxy`.
- Next.js 16 reads the `content-security-policy` **request** header set by proxy code and
  extracts the nonce, applying it to all of its own inline scripts (`self.__next_f` etc.).
  01b should set the CSP header on both the request and the response in `src/proxy.ts`.
- `src/instrumentation.ts` imports `lib/config/env.ts` at boot, so the dev server cannot
  start without a valid `.env` — `cp .env.example .env` first. Build does not run
  `register()`, so CI builds (01c) do not need env vars until `next start` runs.
- The 01a scaffold keeps the default Tailwind theme untouched (tokens are Unit 02), and
  removed the scaffold's Google-font import from the root layout so Unit 02 can install
  self-hosted fonts cleanly.
- `curl` in this PowerShell aliases `Invoke-WebRequest` — verification used `curl.exe -I`
  explicitly.
- The 01b real-browser CSP demo used headless Chrome with
  `--enable-logging=stderr --dump-dom`; CSP console violations surface on stderr. Both
  Chrome and Edge are installed on this machine. Temp demo files used the
  `__*-demo.ts` naming convention and were deleted after each demonstration.
- Background servers for verification: `Start-Process npm.cmd` with stdout/stderr
  redirected to `%TEMP%\opencode\`; the tool kills the launching shell, not the server —
  stop it with `taskkill /PID <pid> /T /F`.
- Next.js 16 proxy nonce confirmed: the `content-security-policy` request header is
  parsed during SSR, and Next stamps its own inline scripts/styles with the nonce
  automatically — verified by matching the header nonce to the `nonce=` attributes in
  the served HTML (single-request capture with `curl.exe -D`).
- `next build`/`next start` run fine with proxy + `headers()`; the build output shows
  `ƒ Proxy (Middleware)` and `/` as dynamic. Prod CSP was verified over `next start`
  with `curl.exe -I` and headless Chrome (no violations).
- Docker Desktop on this machine needed a Windows reboot + WSL2 install after a
  first-run failure (backend stuck for 11+ hours with "backend is not running";
  engine API returned 500 on every call). After reboot it works. If the engine is
  ever down, check `%LOCALAPPDATA%\Docker\log\host\com.docker.backend.exe.log`.
- gh CLI lives at `%LOCALAPPDATA%\Programs\gh\gh.exe` (portable zip — the winget
  MSI hung on a stalled msiexec). It was added to the **user** PATH: new terminals
  pick it up, old ones need a restart. A stray elevated `msiexec` from that attempt
  may still be running — end it in Task Manager if it lingers.
- `next dev` regenerates `next-env.d.ts` to point at `.next/dev/types/`; the
  committed version points at `.next/types/`. Either works (skipLibCheck suppresses
  the missing file on clean checkouts). Revert this churn, don't commit it.
- The smoke test (and any second dev server) conflicts with a running dev server
  over the `.next` lock — run `npm run test` with the dev server stopped.
- Volume names are `computer-operator-ai_postgres-data` / `redis-data` (project
  prefix + the names in `.gitignore`).
- GitHub CLI auth went through `gh auth login` in the user's own terminal after the
  agent-driven device flow timed out twice — device flows need the human to act
  within the polling window.
