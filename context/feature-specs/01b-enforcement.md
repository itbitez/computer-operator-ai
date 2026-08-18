# 01b — Enforcement mechanisms

## Goal

Make three of the invariants **mechanical instead of aspirational**: security headers that
ship on every response, a logger that makes leaking private data a compile error, and a lint
rule that makes a vendor SDK import outside its isolation module impossible to merge.

This is the highest-value unit in Phase 0. Every one of these is painful to retrofit and
cheap to install now.

## Context

01a is complete: the app scaffolds and runs, the folder skeleton exists, the six isolation
stubs exist, and env config validates at boot.

Read first: `context/architecture.md` invariants **3** (isolation), **4** (metadata-only
logs), and the security-headers row in the performance/security discussion.

## Design decisions

- **Headers live in the Next.js config, not nginx.** Version-controlled with the app and
  identical in every environment. nginx will only terminate TLS.
- **CSP uses a per-request nonce** from middleware. `unsafe-inline` for scripts is not
  acceptable — it makes the header decorative.
- **The logger is enforced by the type system,** not by a grep or a review convention. A
  compile error beats a review comment every time.

## Implementation

### 1. Security headers

Applied to every route via the Next.js config:

| Header | Value |
|---|---|
| `Content-Security-Policy` | nonce-based; `default-src 'self'`; no `unsafe-inline` for scripts; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | deny all **except `microphone=(self)`** |
| `X-Frame-Options` | `DENY` |

- Middleware generates a per-request nonce and exposes it to the document.
- `microphone=(self)` is deliberate — Unit 20's voice input needs it, and discovering that
  twenty units later means editing a security header under delivery pressure.
- If a required third party genuinely cannot run under the strict policy, you may ship
  `Content-Security-Policy-Report-Only` **for that single directive**, with a `TODO` naming
  what blocked it, recorded in the tracker. It must be resolved before launch.

### 2. Metadata-only logger (invariant 4)

Create `src/lib/logging/logger.ts`:

- Accepts **only** this closed field set, expressed as a TypeScript interface:
  `timestamp`, `level`, `method`, `path`, `statusCode`, `durationMs`, `userId`,
  `requestId`, `entityType`, `entityId`, `errorCode`, `errorName`.
- **Excess property checking must reject anything else at compile time.** Passing a request
  body, command text, document content, or a raw error object is a type error.
- No free-form `message` field that could carry interpolated user data. Use `errorCode`
  plus the fixed fields.
- Errors log `errorName` and `errorCode` only. Stack traces go to the error tracker in
  Unit 29, never to the application log.
- Output is JSON, one object per line.
- Middleware assigns each request a `requestId` for correlation.

### 3. Isolation rule (invariant 3)

ESLint `no-restricted-imports`:

- Vendor SDK package names — model provider, object storage, bKash, `bullmq`, mail/SMS, the
  auth SDK — banned **everywhere except their own `src/lib/<module>/` directory**.
- `process.env` banned outside `src/lib/config/`. All environment access goes through the
  one validated config module.
- Each rule's error message must name the module to import instead.

## Non-goals

- No Docker, no CI workflow, no tests — 01c
- Do not wire the logger into routes beyond the middleware request log
- Do not install any actual vendor SDK; the stubs stay empty
- No rate limiting — that ships with auth in Unit 06

## Security requirements

- Headers verified against a **running server**, not read off the config file.
- CSP proven to block an inline script in a real browser.
- The isolation rule proven to actually fail on a banned import.

## Verification checklist

- [ ] `curl -I` against the running app shows all six headers with the specified values
- [ ] CSP nonce is present and differs between two requests
- [ ] An inline `<script>` is blocked in a real browser, with a console violation — demonstrated, then reverted
- [ ] `Permissions-Policy` allows `microphone=(self)`
- [ ] Passing a request body to the logger is a **compile error** — demonstrated, then reverted
- [ ] Logger output is valid one-line JSON containing only permitted fields
- [ ] Each request gets a distinct `requestId`
- [ ] Importing a banned vendor SDK outside its `lib/` module fails ESLint — demonstrated, then reverted
- [ ] Using `process.env` outside `lib/config` fails ESLint — demonstrated, then reverted
- [ ] `npx tsc --noEmit` and ESLint both pass with zero errors and zero warnings
- [ ] `context/progress-tracker.md` updated

## Dependencies

01a complete.
