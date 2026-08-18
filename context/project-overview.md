# Project Overview

<!-- From Phase 1. This resolves ambiguity when a spec is not specific enough. -->

## Summary

A subscription-based, Bengali-first web platform that replaces a human DOCX operator by
allowing coaching center owners to generate, edit, and format `.docx` documents from scratch,
and modify their existing uploaded `.docx` files (text and tables only, with basic formatting
preserved), purely through written or voice commands in natural Bengali, while managing
payments via bKash and restricting generation access based on active subscription status.

Operating context: a production SaaS handling users' commercial intellectual property
(question papers, syllabi, teaching materials), real bKash money movement, and mobile
numbers. That demands production-grade security, not demo-grade.

## Goals

1. Let a coaching center owner produce a correctly structured `.docx` from a Bengali
   command (typed or spoken) within 15 seconds, 95% of the time.
2. Build a self-sustaining subscription business: bKash one-time payments (manual renewal),
   server-enforced subscription states, read-only access preserved after expiry so users
   never lose their work.
3. Never leak the document corpus or command history: cross-tenant access is impossible by
   construction, enforced server-side and proven by tests, not inspection.

## Users

| Role | Needs |
|---|---|
| Coaching Owner | Pay via bKash; issue Bengali text/voice commands to generate, edit, and format DOCX files; upload existing DOCX to modify; download and manage document history; manage profile and subscription. |
| Super Admin (application owner) | View subscription totals/MRR, configure pricing plans and the global AI system prompt, manually override user access on payment disputes, view system logs. |
| System actors (not users) | bKash API (payment webhooks), Groq AI model (inference), system scheduler (daily expiry checks and purge jobs). |

## Core flows

**Coaching Owner — onboarding:** lands on public landing page → registers with mobile
number and email → mobile verified via OTP → picks plan (monthly/quarterly/yearly, BDT) →
initiates bKash payment → completes in bKash app → webhook activates subscription with
expiry date → dashboard unlocked.

**Coaching Owner — core loop:** types a Bengali command or taps the mic (Web Speech API,
consent disclosed) → command sent to AI (Groq) with a Bengali system prompt forcing
structured JSON output → backend enqueues a document job → Python worker builds the
`.docx` via python-docx → uploads to private object storage → download card appears in
chat → user downloads or sends follow-up commands to refine.

**Coaching Owner — upload-and-edit:** clicks Upload → selects an existing `.docx` →
backend parses text, tables, and basic styles (python-docx; images/headers/footers/page
layout ignored) → user gives a Bengali command → AI regenerates the whole document with
the change applied → new file downloadable from history.

**Coaching Owner — expiry:** 3 days before expiry email reminder → on expiry the
Generate/Edit controls disappear; account becomes read-only — user can still log in, view,
and download all their documents indefinitely → renews via bKash → full access returns
immediately.

**Super Admin — audited access:** opens admin panel → selects a user → states a reason →
system generates a one-time 24-hour token and writes an append-only audit entry → views
that user's data in an audited view with a persistent banner. No ambient access, no bulk
export.

## Features and the technology that serves them

| Feature | Technology |
|---|---|
| Bengali chat interface, text + voice | Next.js App Router + Web Speech API (client-side transcription; audio transits Google's servers — disclosed to user) |
| AI document structuring (Bengali → JSON) | Groq (Llama 3 family) behind `lib/ai` isolation module |
| DOCX parsing and generation | Python 3.11 + FastAPI + python-docx (stateless worker) |
| Job queue and retries | Redis + BullMQ (Node owns the queue; Node queue-processor calls the FastAPI worker over HTTP) |
| Database | PostgreSQL (relational core + JSONB for AI payloads) |
| File storage | Private S3-compatible object storage (MinIO in dev), server-side encryption, 5-minute pre-signed URLs |
| Payments | bKash Merchant API (one-time payments, webhook signature verification, idempotency) |
| Auth | NextAuth.js, JWT strategy, refresh rotation, OTP verification |
| Notifications | Email (SMTP) and SMS via `lib/notifications` abstraction (console fallback until vendor chosen) |
| i18n | next-i18next: Bangla primary (`bn`), English fallback (`en`) |

## In scope

Bengali-first chat generation of DOCX (headings, fonts, tables, lists, page breaks,
margins), iterative refinement, upload-and-edit of existing DOCX (text/tables/basic styles
only), voice input with consent disclosure, document history with versioning and soft
delete + 30-day restore, bKash one-time payments (manual renewal), subscription lifecycle
with read-only expiry, profile management, super-admin panel with audited access and
settings management, WCAG 2.1 AA, rate limiting, observability, retention jobs.

## Out of scope

- Legacy `.doc` (pre-2007) files — `.docx` only; `.doc` uploads get a conversion error.
- PDF or Excel export; any format other than `.docx`.
- Macros / VBA — the AI refuses with a static message.
- Track changes, comments, document comparison.
- Mail merge / bulk document generation.
- Mathematical equations / LaTeX rendering (plain text only).
- Image, chart, or graph generation/insertion.
- Image extraction from uploaded files (parsed as `[IMAGE PLACEHOLDER]`), header/footer
  preservation, page-layout preservation — uploads rebuild with default A4 portrait.
- Multi-seat, team, or delegated accounts — strictly one user per subscription.
- Public template gallery or marketplace.
- Native mobile apps — responsive web only.
- Third-party integrations beyond bKash and Groq (no Drive, Dropbox, SMS-vendor
  alternatives are internal choices, not features).
- Real-time collaboration.
- Advanced typography / desktop publishing.
- Auto-renewal / recurring bKash agreements — manual renewal only (deferred decision).

Do not add these, and do not design for them speculatively.

## Success criteria

1. Voice transcription reaches ≥ 70% accuracy across 50 sample Bengali coaching commands;
   below that, the UI prompts "Please type your command for better accuracy."
2. 99% of valid AI responses produce a downloadable `.docx`; malformed JSON is logged and
   the user gets a "rephrase" fallback message.
3. Command submission → download button appears in ≤ 15 seconds for 95% of requests.
4. 100 manually validated generated documents contain all requested structural elements
   with no hallucinated sections.
5. An unauthenticated visitor cannot view or download any stored document — 401.
6. An authenticated request from an expired subscriber to the generate/edit API returns
   403 — verified by automated test against a real expired fixture account, not by UI
   inspection.
7. A request for another user's document or chat returns 404 (never confirms existence).
8. The bKash webhook endpoint rejects unsigned or spoofed payloads — 401.
9. No audio is ever stored server-side; the voice flow shows the Google-servers disclosure
   before first use; network inspection shows no audio to our servers.
10. The system supports 30 simultaneous generating users without crashes or timeouts
    exceeding 20 seconds (load-tested).
11. Every generated document remains downloadable from history at least 6 months after
    generation — and indefinitely unless the account is self-deleted.

## Open decisions

<!-- Recorded, not resolved. Never assume an answer to these. -->

| # | Decision | Blocks |
|---|---|---|
| D1 | Data residency: do the Cyber Security Act 2023 / Bangladesh Bank rules require financial and document data to remain physically in Bangladesh? | Production hosting region, S3 bucket region, SMS vendor choice (Units 07, 10, 12) |
| D2 | Cross-border transfer + DPA: does sending document content to Groq (US-hosted inference) comply, and will Groq sign a no-training DPA? | AI provider selection (Unit 15) — proceed with Groq behind `lib/ai` until answered |
| D3 | bKash contractual retention period for transaction records (assumed 5 years, configurable). | Final value of the payment archive TTL (Unit 30) |
| D4 | Breach notification timelines and penalties under the Cyber Security Act 2023 and bKash terms. | Incident response runbook (Unit 34) |
| D5 | Legal classification of coaching documents (commercial IP vs "personal information" under Bangladeshi law). | Terms of Service and Privacy Policy wording linked from the landing page (Unit 08) |

External dependency, not a decision: **bKash merchant onboarding / sandbox credentials**
gate Unit 12 — start onboarding now; build against a mock bKash server meanwhile.

**Critical path:** D1 is the critical path — it determines production hosting before
launch. D2 determines the AI provider before launch. Both need a qualified legal answer;
both are insulated during development by the isolation modules.
