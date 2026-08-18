# Architecture

<!-- From Phase 3, constrained by Phase 2. -->

## Stack

| Layer | Choice | Role |
|---|---|---|
| Web framework | Next.js (App Router) + TypeScript | Server-rendered UI, thin API route handlers, orchestration |
| Document worker | Python 3.11 + FastAPI + python-docx | Parses uploaded DOCX and generates DOCX from contract JSON. Stateless HTTP worker |
| Database | PostgreSQL | Relational core (users, subscriptions, transactions, documents, messages, audit) + JSONB for AI payloads |
| File storage | Private S3-compatible object storage (MinIO in dev) | Document binaries and temporary uploads. Never public |
| Queue | Redis + BullMQ | Job queue, retries, OTP TTLs, rate-limit counters. **Node owns the queue** |
| Auth | NextAuth.js (JWT strategy) + refresh rotation + OTP | Stateless sessions; server-side re-check of `is_active` and expiry on every protected route |
| Payments | bKash Merchant API | One-time payments (manual renewal only), webhook verification, idempotency |
| AI | Groq via `lib/ai` isolation module | Bengali command → structured JSON document spec |
| Notifications | SMTP email + SMS via `lib/notifications` abstraction | Expiry reminders, OTP delivery |
| Hosting | Single VPS, Docker Compose (nginx → Next.js, FastAPI, Redis, Postgres) | One machine, one private network, no cross-region hops. Region decision gated by D1 |
| UI | Tailwind CSS + shadcn/ui, design tokens from `ui-context.md` | Styled, accessible components |
| i18n | next-i18next (`bn` default, `en` fallback) | All user-facing strings through the catalogue |

## The isolation rule

Unresolved vendor choices, and what they are blocked on:

| Module | Current vendor | Blocked on |
|---|---|---|
| `lib/ai` | Groq | D2 (cross-border transfer + DPA) |
| `lib/storage` | S3-compatible | D1 (residency → region) |
| `lib/payments` | bKash | sandbox onboarding (external dependency) |
| `lib/notifications` | console/SMTP fallback | D1 (SMS vendor residency) |

**Every vendor is reached only through its own module.** Application code imports
`lib/<name>`, never the vendor SDK:

```
lib/ai/client.ts        — the only file that imports the model-provider SDK
lib/storage/client.ts   — the only file that imports the object-storage SDK
lib/payments/client.ts  — the only file that imports the bKash SDK
lib/notifications/sms.ts— the only file that imports the SMS/email vendor
lib/queue/client.ts     — the only file that imports bullmq
lib/auth/auth.ts        — the only file that imports the auth SDK
```

Enforced by an ESLint `no-restricted-imports` rule in CI. This is not ceremony. If a
constraint lands after forty route handlers import the SDK directly, the migration is a
rewrite. Behind a module, it is contained.

## System boundaries

```
src/
  app/                 Routes. Server-rendered by default.
    api/               Route handlers. Thin: authenticate → authorise → validate → delegate.
  components/          Presentational UI. No data fetching, no business logic.
  lib/                 Vendor boundaries + domain logic. No UI code here.
    services/          Domain services (document, subscription, audit). Tested directly.
    validators/        Zod schemas for every external input.
    contracts/         Versioned Node↔Python JSON contract (generation-request / -response).
  jobs/                Scheduled background work (expiry checker, purges, reconciliation).
  db/                  Schema and migrations.
python-worker/
  app/docx/            parser.py (DOCX → JSON), generator.py (JSON → DOCX)
  app/models/          Pydantic schemas mirroring lib/contracts
  tests/               Worker unit + integration tests
```

**Business logic lives in `lib/`, never in a route handler.** Route handlers get tested
through HTTP; `lib/` functions get tested directly.

**Node ↔ Python:** Node's BullMQ queue-processor consumes jobs and calls the FastAPI
worker over HTTP (same host, private network). Python never touches BullMQ. The HTTP body
is the versioned contract; the worker is stateless.

## Data model — core entities

- **User** — account + profile + credentials; `is_super_admin` flag marks the single
  admin row (no separate admin table); `is_active` is the master kill switch.
- **Subscription** — tier, start/expiry dates, status (`active`/`expired`/`cancelled`/
  `grace_period`). Access checks always read current DB state.
- **PaymentTransaction** — every bKash interaction: request/response/webhook payloads,
  idempotency on bKash transaction ID, status transitions in a transaction.
- **Document** — metadata + ownership (`user_id`), version chain (`parent_document_id`,
  `version_number`), soft delete flag, binary lives in object storage; DB stores the
  reference only.
- **Message / Conversation** — persistent chat history (commands + AI responses); distinct
  from ephemeral session context (Redis, rebuilt from history on resume).
- **AdminAuditLog** — append-only, immutable (DB trigger blocks UPDATE/DELETE even for
  the admin role); every privileged admin access and mutation.
- **SystemLog** — metadata-only (method, URL, status, IDs, IP, user-agent, latency).
- **RefreshToken, PasswordResetToken** — hashed, TTL'd.
- **Setting** — global config (system prompt, plans, quotas); `is_secret` values encrypted.
- **TempUpload** — 24h lifecycle, separate temp bucket.

## Data classification

<!-- Straight from Phase 2. This drives encryption, logging, and retention. -->

| Data | Class | Retention |
|---|---|---|
| IDs, timestamps, metadata, config (non-secret) | internal | with parent record |
| Full name, email, IP addresses, institution address | personal | until account deletion + 30d |
| Mobile number | sensitive personal | until account deletion + 30d |
| Document binaries, document content, command text, chat history, AI generation context, extracted content JSON | sensitive personal (commercial IP) | indefinite; deleted only on self-delete + 30d grace |
| bKash transaction IDs, payment amounts, webhook/response payloads | sensitive personal | 5 years (assumed, config-driven — D3), anonymized on account deletion |
| Password hashes, JWT secrets, refresh tokens, OTP codes, reset tokens, API keys, DB credentials, encryption key | secret | rotation path required; OTP 5 min, reset 1 h |
| System logs | internal (metadata-only) | 90 days |
| Admin audit logs | sensitive (immutable) | 5 years |

## Authorization matrix

| | Own documents | Others' documents | Own chat | Others' chat | Own payments | Others' payments | System logs | Settings | User management |
|---|---|---|---|---|---|---|---|---|---|
| Coaching Owner | full | none (404) | full | none (404) | own | none (404) | none | none | self-delete only |
| Super Admin | audited token only | audited token only | audited token only | audited token only | audited token only | audited token only | full | full | full (audited) |
| bKash API | none | none | none | none | write-only webhook | write-only webhook | none | none | none |
| Groq AI | read-only: command + document being edited | none | current context only | none | none | none | none | system prompt | none |
| Scheduler | metadata only | metadata only | none | none | none | none | none | none | none |

Cross-tenant reads return **404**, never 403 — do not confirm existence. The super-admin
"audited token only" cells mean: reason required, one-time 24-hour token, append-only
audit entry, no bulk export, no ambient browsing.

## Storage model

PostgreSQL holds relational data, metadata, and JSONB AI payloads. Object storage holds
document binaries and temporary uploads; the DB stores only the reference. Blob access is
**private, always** — bucket-level public access blocked. Downloads go through an
authenticated route that verifies `user.id == document.owner_id` (or an audited
super-admin token) and issues a **5-minute pre-signed URL**. The binary never streams
through the Node process.

## Background work

Anything that can exceed a request budget runs as a job — the handler authenticates,
authorizes, validates, enqueues, returns a job ID; progress streams over SSE (authorized
by job ownership) with polling fallback:

- AI document generation and edit/refine (typical 3–20 s)
- Uploaded-DOCX parsing (CPU-bound)
- Daily subscription expiry sweep + grace emails
- Daily payment reconciliation against bKash
- Log purge (90 d), temp-file purge (24 h, via S3 lifecycle), payment archive (config TTL)
- Bulk email fan-out

## Durability & availability

The product promises users never lose their work: documents stay downloadable indefinitely,
and expired accounts keep read-only access forever. That is a **durability guarantee**, and
it is hosted on one machine.

**The availability trade-off is accepted deliberately, not overlooked.** A single VPS keeps
every hop on one private network, which is what makes the 15-second budget reachable and
what keeps the residency decision (D1) simple. The cost is that the machine is a single
point of failure. That is acceptable at launch scale; it is not acceptable to also have no
recovery path.

So durability is bought with backups rather than redundancy:

- **Postgres:** automated daily backup plus point-in-time recovery, retained 30 days,
  stored **off the application VPS**.
- **Object storage:** bucket versioning on, so an overwrite or delete is recoverable, with
  replication to a second location.
- **A restore is performed and timed before launch,** and re-tested whenever the schema
  changes materially. An untested backup is not a backup — it is an assumption.
- Recovery targets: **RPO ≤ 24 h, RTO ≤ 4 h.** If a restore cannot meet these, the hosting
  decision gets revisited, not the promise.

Revisit single-VPS hosting when either sustained concurrency approaches the 30-user budget
or downtime starts costing more than redundancy would.

## AI pipeline

- The Bengali system prompt defines the AI as an expert DOCX builder and forces
  **structured JSON output** matching the versioned contract in `lib/contracts/`.
- Model output is **untrusted data**: validated against a schema, never executed, never
  interpolated into SQL, never trusted for authorization. Invalid JSON → logged, user
  gets a "please rephrase" fallback.
- Limits: upload ≤ 50 MB; parsed text ≤ 10,000 characters (truncation flag set, user
  notified); generated output ≤ 5,000 words. Beyond limits → 400 with an actionable
  message. No silent failures.
- Per-user quota caps AI spend (default 50 calls/day, configurable).
- Voice transcription happens client-side via Web Speech API; audio transits Google's
  speech servers (disclosed to the user before first use); **no audio is ever stored
  server-side**. Transcribed text is data of class sensitive personal.
- Editing an uploaded file sends its parsed content to the AI — document content egresses
  to the inference provider (D2, disclosed in Privacy Policy).

## Payments

- One-time payments only; manual renewal. No bKash recurring agreements (deferred).
- Webhook endpoint verifies bKash's signature; unsigned requests → 401. Idempotency on
  `bKash_transaction_id` — duplicate webhooks are ignored.
- Subscription state is derived **only** from server-verified bKash records. Client-
  reported success is never trusted. Daily reconciliation job re-checks against bKash.
- Refunds are processed manually via the bKash portal; the admin records the outcome
  (audited). Disputed users are handled with the admin override, not payment logic.

## Subscription state machine

| State | Log in | View/download own files | Generate/edit (UI) | Generate/edit (API) |
|---|---|---|---|---|
| Unauthenticated | no | no | no | 401 |
| Never paid | yes | no (empty library) | no | 403 |
| Active | yes | yes | yes | 200 |
| Expired (read-only) | yes | yes, indefinitely | hidden | 403 |

The `can_generate` check reads `subscription_expiry > now()` server-side on every request.
UI hiding is cosmetic, never the control.

## Invariants

<!-- Rules the system must never violate, regardless of what a spec says.
     The security and performance baselines are merged here. -->

1. **Authorization is enforced server-side at every mutation and every read of non-public
   data.** Hiding a UI control is not access control. Unknown records return 404 — never
   confirm existence to an unauthorized caller.
2. **Every privileged mutation** (super-admin access to user data, admin setting change,
   subscription override) **writes an append-only audit entry**: actor, action, entity,
   before, after, timestamp. Never updated, never deleted, never cascaded away.
3. **No vendor SDK is imported outside its `lib/` isolation module** (`ai`, `storage`,
   `payments`, `notifications`, `queue`, `auth`). Application code imports the module,
   never the vendor.
4. **Logs are metadata-only.** No request/response bodies, no command text, no document
   content, no PII — enforced by a CI check that fails on body serialization. Secrets
   never appear in logs or error messages.
5. **Blob storage is private, always.** Files are reached only through an authenticated
   route that verifies `user.id == document.owner_id` (or an audited super-admin token)
   before issuing a short-lived (≤ 5 min) pre-signed URL.
6. **No long-running work in a request handler.** Anything past ~3 s is a background job:
   authenticate → authorize → validate → enqueue → return job ID.
7. **Every external input** — bodies, query params, headers, env vars, webhook payloads,
   AI output — **is validated against a schema at the boundary.** Parameterized queries
   only. Unexpected fields are rejected, not ignored.
8. **AI model output is untrusted data.** Never executed, never interpolated into SQL,
   never trusted for authorization. Every AI call is capped by a per-user quota. Rate
   limits apply per user **and** per IP on auth, generate, and upload endpoints.
9. **Payment state is derived only from server-verified bKash records** with signature
   verification and idempotency keys. Client-reported success is never trusted.
   Subscription access checks read current DB state, never client-supplied values.
10. **Super admins have no ambient access** to user documents, chat, or payments. Access
    requires an explicit, audited, one-time-token action.
11. **All sensitive-personal data is encrypted at rest and in transit.** Passwords use
    bcrypt or argon2id — never MD5/SHA/unsalted. Secrets live in the platform secret
    store, never in source, client bundles, or logs; a rotation path exists for each.
12. **Every unit ships authorization tests**: an unauthenticated caller and a non-owning
    caller are both rejected on every protected endpoint; an expired subscriber is
    rejected on generate/edit. This is the test people skip and the one that matters most.
13. **Typecheck, lint, and tests gate every merge.** Migrations are reviewed and
    reversible. No force-push to a shared branch. Lockfile committed; dependency scanning
    in CI.
14. **No user-facing string is hardcoded** — all UI text goes through the i18n layer
    (Bengali-first, `bn` default, `en` fallback). Numbers, dates, and currency go through
    the shared formatter — no ad-hoc formatting, no mixed numerals.

15. **User documents are recoverable.** Postgres backups and object-storage versioning are
    live before the first real user account exists, stored off the application host, with a
    restore that has actually been performed — not assumed. The product promises users never
    lose their work; a promise with no recovery path behind it is a liability, not a feature.

If a spec appears to require breaking one of these, stop and raise it.

## Performance budgets

<!-- Set in Phase 3. Measured as p95/p99, never averages. -->

| Metric | Budget |
|---|---|
| Server response (API routes, p95) | < 200 ms |
| Command → download button available (p95) | ≤ 15 s |
| Largest Contentful Paint | < 2.0 s |
| Interaction to Next Paint | < 150 ms |
| Cumulative Layout Shift | < 0.05 |
| Initial JS bundle (compressed) | < 180 KB |
| Database query (p95) | < 30 ms |
| Concurrency | 30 simultaneous generating users, no timeout > 20 s |

Baseline rules that carry the same weight as the budgets: no N+1 queries, index what is
filtered/sorted/joined on, cursor pagination on every growing list, no unbounded
`findMany`, `EXPLAIN` before merging any query on a growing table, connection pool with a
known limit, state the caching strategy with its invalidation (never cache another user's
data — cache keys include identity), server-render by default, code-split on routes, and
the question asked of every operation: *what happens when the input is ten times larger
than expected?*
