# 01a — Application skeleton

## Goal

A running Next.js application with the folder structure, empty isolation modules, and
validated environment configuration that every later unit depends on. Nothing else.

No security headers, no logger, no CI, no Docker — those are 01b and 01c.

## Context

The repository contains only `AGENTS.md`, `CLAUDE.md`, `context/`, `.gitignore`, and
`.gitattributes`. There is no `package.json` and no application code.

Read first: `context/architecture.md` (stack table, isolation rule, system boundaries) and
`context/code-standards.md`.

**Framework versions:** your training data is older than what you will install. After
installing, check the resolved versions and record the actual majors in the progress
tracker. Do not assume config file shapes from memory — Next.js config and ESLint flat
config have both changed recently.

## Implementation

### 1. Scaffold

- Scaffold Next.js with the App Router and TypeScript **into the repository root**. Files
  already exist here — scaffold in place, do not create a nested folder.
- `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `noUnusedLocals`,
  `noUnusedParameters`.
- Install Tailwind. **Leave the default theme untouched** — tokens are Unit 02.
- One placeholder page rendering the text "Computer Operator AI". No styling, no product UI.

### 2. Folder skeleton

Create these with a `.gitkeep` in each, matching `architecture.md` § System boundaries:

```
src/app/api/
src/components/
src/lib/services/
src/lib/validators/
src/lib/contracts/
src/jobs/
src/db/
```

### 3. Isolation module stubs

Create one file per isolation module so 01b's ESLint rule has real targets:

```
src/lib/ai/client.ts
src/lib/storage/client.ts
src/lib/payments/client.ts
src/lib/notifications/client.ts
src/lib/queue/client.ts
src/lib/auth/client.ts
```

Each exports a placeholder type only. **No vendor SDK is installed or imported.**

### 4. Environment configuration

- `src/lib/config/env.ts` — validate every environment variable with Zod at module load.
  Fail immediately and loudly, naming the missing or malformed variable.
- Start with only what exists now: `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`. Later units add
  their own.
- `.env.example` listing every key with **no real values**. Committed.
- `.env` for local use. Confirm it is gitignored **before** creating it.

## Non-goals

- No security headers, no middleware — 01b
- No logger — 01b
- No ESLint isolation rule — 01b
- No Docker, no CI, no tests — 01c
- No design tokens or theme — Unit 02
- No i18n — Unit 03
- No database schema — Unit 05
- No vendor SDKs of any kind

## Security requirements

- Confirm `git check-ignore -v .env` reports it ignored **before** writing `.env`.
- No real secret in `.env.example` or any committed file.

## Verification checklist

- [ ] `npm run dev` starts and the placeholder page loads in a browser
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Every folder in §2 exists
- [ ] All six isolation stubs exist and import cleanly
- [ ] Booting with a required env var missing fails immediately, naming that variable — demonstrated
- [ ] `git check-ignore -v .env` confirms `.env` is ignored
- [ ] `.env.example` contains no real values
- [ ] Resolved Next.js, React, TypeScript and Node majors recorded in the progress tracker
- [ ] `context/progress-tracker.md` updated

## Dependencies

None. Blocks 01b and everything after.
