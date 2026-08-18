# Progress Tracker

> The single source of truth for where this build stands. Updated after every unit.
> Agents: read this before anything else in `context/`.

**Last updated:** 2026-08-18 (setup review complete; unit plan resequenced; no units built)

---

## Current phase

Phase 0 — Foundation. Scaffold, tokens, i18n, UI primitives, database, auth, worker
skeleton. Nothing built on a missing foundation survives the retrofit.

## Current goal

Write the spec for Unit 01 (Scaffold + CI gates) and implement it.

## In progress

Nothing.

## Complete

Nothing yet — setup only.

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
| 01 | Scaffold + CI gates + Docker Compose + metadata-only logging + **security headers (CSP, HSTS, nosniff, referrer-policy, frame-ancestors)** | ☐ |
| 02 | Design tokens, self-hosted fonts, Tailwind theme | ☐ |
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
