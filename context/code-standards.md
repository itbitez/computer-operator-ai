# Code Standards

<!-- Keeps a codebase built across thirty-plus agent sessions consistent. -->

## Language

- TypeScript with strict type checking on. No exceptions.
- **Never use `any`.** Narrow from `unknown` instead. If you genuinely cannot type
  something, stop and ask — that is a design signal.
- Annotate exported signatures; let locals infer.
- Python (worker): type hints on all function signatures, Pydantic v2 models for every
  external shape, `ruff` for lint and formatting.
- **Validate every external input at the boundary with a schema** — request bodies, query
  params, env vars, third-party responses, AI output. Zod in Node, Pydantic in Python.
  Never trust a shape you did not construct.

## Framework (Next.js / FastAPI)

- Server components are the default. Client components (`'use client'`) only where browser
  interactivity is required: chat, voice, SSE, modals, toasts.
- Route handlers stay thin, in this order: authenticate → authorise → validate → delegate
  to `lib/` → shape the response. Business logic lives in `lib/`, not in the handler.
- Never import a database client, auth SDK, or secret-bearing module into client code.
- Data fetching happens at the page/route level; components receive props, not queries.
- The FastAPI worker is stateless: receives the versioned contract, returns the result.
  It imports no queue library. Its responses conform to the schema in `lib/contracts/`.

## API responses

Uniform across every endpoint:

- `200` / `201` — success
- `400` — validation failure, naming which field failed
- `401` — not authenticated
- `403` — authenticated but not permitted
- `404` — not found, **or** found but not visible to this caller (never confirm existence)
- `500` — unexpected; log detail server-side, return a generic message

Never return a raw error, stack trace, or database message to a client.

## Errors

- Catch at the boundary, not at every call site.
- Log with enough context to debug — actor, entity, operation — and **never** log PII,
  credentials, tokens, command text, or document content. Logs are metadata-only
  (invariant 4).
- A failed mutation must not leave the UI showing success. Gate every transition — dialog
  close, redirect, refresh — on the operation actually succeeding.

## Styling

- **No raw colour, spacing, font, or radius values in components.** Tokens only.
- No arbitrary utility values like `text-[#006A4E]`. Extend the theme instead.
- Tokens are defined in `ui-context.md` and mapped into the Tailwind theme. Where they
  disagree, `ui-context.md` wins and the theme gets corrected.

## Internationalisation

- **No hardcoded user-facing strings.** Everything through the message catalogue.
- Bangla (`bn`) is primary; English (`en`) is fallback.
- Numbers, dates, and currency go through the shared formatter (locale-aware numerals —
  Bangla digits in Bangla UI, `৳` symbol regardless of locale). No ad-hoc formatting.
- Missing translations fall back visibly, not silently.

## Database

- All schema changes go through a reviewed migration. Never edit the database directly.
- Index what you filter, sort, or join on.
- **Parameterised queries only.** No string-concatenated SQL, anywhere, ever.
- Cascade deletes only where the child genuinely cannot outlive the parent.
  **Audit entries never cascade** — they outlive everything.
- Queries live in `lib/`, not in components or handlers.
- Soft delete for documents (30-day restore window). Payment records are anonymized
  (`user_id` → deleted-user marker) rather than cascade-deleted.

## Naming

- Files `kebab-case`. Types and components `PascalCase`. Functions and variables
  `camelCase`. DB columns `snake_case`.
- Booleans read as assertions: `isActive`, `hasAuditEntry`, `canEdit`.
- Say what a thing is, not what layer it lives in. `DocumentService`, not `DocumentData`.

## Testing

Every unit ships tests for its own verification checklist. At minimum:

- **Authorisation: an unauthenticated caller and a non-owning caller are both rejected,
  and an expired subscriber is rejected on generate/edit.** This is the test people skip
  and the one that matters most.
- The happy path.
- The failure path the spec calls out.

A checklist item that can be expressed as a test **should** be one. Services in `lib/`
are unit-tested directly; routes are integration-tested over HTTP.

## Comments

Explain *why*, never *what*. A comment restating the code is noise. A comment recording
why a non-obvious decision was made is valuable — and if it is architectural, it belongs
in the progress tracker too.
