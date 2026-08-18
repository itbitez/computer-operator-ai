# 02 — Design tokens, self-hosted fonts, Tailwind theme

## Goal

Turn `context/ui-context.md` into the only design vocabulary in the codebase: every colour,
font, radius, shadow, and breakpoint exists as a named token, Noto Sans Bengali and Inter
are self-hosted with zero third-party font requests, and a script + tests + CI job
mechanically enforce token-only styling and the WCAG contrast of the pinned token pairs.
No product UI ships here — Unit 04 consumes this.

## Context

This spec was written before Unit 01 was built, and assumes Unit 01 shipped exactly its
spec: Next.js App Router + strict TypeScript at the repo root, Tailwind installed with the
default theme, ESLint (including `no-restricted-imports`), a test runner, a CI workflow
that blocks merge, and a single placeholder route. If Unit 01 deviated in a way that
affects this unit (e.g. a different Tailwind major or test runner), reconcile against this
spec and record the reconciliation in the progress tracker.

Files this unit owns: `src/app/globals.css`, `src/app/layout.tsx`, the Tailwind theme
(whatever mechanism the installed Tailwind major uses — `@theme` in CSS for v4, a config
file for v3), `public/fonts/` (new), `scripts/verify-tokens.mjs` (new), `package.json`
(one script), the existing CI workflow (one new job), and `context/ui-context.md` (receives
the generated ramp and shadow values).

Read first: `context/ui-context.md` — the design source of truth. Where the theme and
ui-context disagree, ui-context wins and the theme gets corrected (code-standards). Also
`context/code-standards.md` § Styling.

Open decisions: none block this unit. D1/D2 concern hosting and the AI vendor; design
tokens are neutral.

Version drift: check which Tailwind major Unit 01 actually installed before writing any
theme code. Your training data may predate it — Tailwind v4 moved configuration into CSS
(`@theme`). Verify against the installed package, not memory.

## Design decisions

- **Colour values live exactly once, as CSS custom properties in `globals.css`**
  (`--color-primary-500`, …). The Tailwind theme references `var(--color-*)` by name (v3
  config object or v4 `@theme`); the verification script and tests parse `globals.css`.
  No colour value is duplicated anywhere else. This is the convention Units 04+ build on.
- **Token names map to Tailwind paths**: `--color-primary-500` → `colors.primary.500`,
  `--color-text-muted` → `colors.text.muted`. DEFAULT aliases: `primary` → 500,
  `secondary` → 100, `accent` → 400.
- **Two token decisions approved 2026-08-18** (recorded in the tracker and applied to
  `ui-context.md`):
  - `text-muted` is `#6E6E6E`, not `#8A8A8A`. The original measures 3.1:1 on
    `secondary-100` and 3.5:1 on white — below the 4.5:1 bar ui-context demands.
    `#6E6E6E` measures 4.6:1 / 5.1:1.
  - New token `border-interactive` = `#8C8C8C`. The three existing border tokens are
    1.4–1.8:1 against `secondary-100` — acceptable as decorative dividers (WCAG 1.4.11),
    not as the only boundary of a form field or toggle. `#8C8C8C` measures 3.0:1 / 3.4:1
    against those surfaces (≥ 3:1 required).
- **Only `primary`, `secondary`, `accent` get 50–900 ramps.** Semantic (`success`,
  `error`, `warning`, `info`), text, and border colours are flat.
- **Ramps are generated around the anchors, not picked by eye**, under checkable
  constraints (see §1). Every generated value is written back into `ui-context.md` so it
  stays the complete source of truth.
- **Global focus visibility via `:focus-visible` outline**: `2px solid primary-500`,
  offset 2px (6.6:1 on white, 6.0:1 on `secondary-100`). Component-level ring styling is
  Unit 04's (shadcn), not this unit's.
- **Fonts are self-hosted `@font-face` files, not `next/font`** — ui-context requires
  self-hosting with `font-display: swap`; `next/font/google` fetches at build time and is
  unnecessary. Same-origin files also satisfy Unit 01's CSP (`default-src 'self'`) with no
  header changes.
- **Spacing is not configured.** Tailwind's default scale already matches ui-context's
  8px steps (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). No `spacing` key anywhere.
- **DEFAULT radius = `md` (8px)** so the bare `rounded` utility is never a trap; named
  radii remain the convention.
- **Zero new npm packages.** Font downloads are manual; verification uses Node built-ins
  (`fs`, `path`, `child_process`) and the existing test runner.

## Implementation

### 1. Colour tokens — `src/app/globals.css`

- Define the colour tokens as CSS custom properties (`:root` block in Tailwind v3; the
  `@theme` block in v4) in `globals.css`:
  - `primary-50…900`, with `primary-500` exactly `#006A4E`
  - `secondary-50…900`, with `secondary-100` exactly `#F5F3F0`
  - `accent-50…900`, with `accent-400` exactly `#D4A02B`
  - flat: `success #0F7B3A`, `error #B91C1C`, `warning #B45309`, `info #1C6FB4`
  - `text-primary #1A1A1A`, `text-secondary #4A4A4A`, `text-muted #6E6E6E`,
    `text-inverse #FFFFFF`
  - `border-light #E5E2DE`, `border-medium #D6D0C8`, `border-heavy #BDB5AB`,
    `border-interactive #8C8C8C`
- Ramp generation constraints — each enforced by the verification script:
  - anchor exact (case-insensitive hex match);
  - lightness strictly increases from 50 → 900;
  - hue within ±5° of the anchor's hue and saturation within ±5 percentage points of the
    anchor's saturation at every step (same colour family);
  - step 50 lightness ≥ 95%, step 900 lightness ≤ 22% (tint/shade endpoints);
  - adjacent steps differ by 4–12% lightness (no dead steps, no jumps).
- Map into the Tailwind theme so utilities resolve: `bg-primary-500`, `text-muted`,
  `border-interactive`, etc., referencing `var(--color-*)`; DEFAULT aliases per the design
  decisions.
- After generation, write every ramp value into the colour table in `ui-context.md`.

### 2. Typography & fonts

- Download woff2 files into `public/fonts/` (source: google-webfonts-helper; fallback: the
  OFL releases in the `google/fonts` GitHub repo), keeping the license files beside them:
  - `noto-sans-bengali-{400,500,700}-bengali.woff2` — unicode-range `U+0980-09FF`
  - `noto-sans-bengali-{400,500,700}-latin.woff2` — Google's standard latin range
  - `inter-400-latin.woff2`
  - `LICENSE-OFL-NotoSansBengali.txt`, `LICENSE-Inter.txt`
- One `@font-face` block per file in `globals.css`: `font-family` `'Noto Sans Bengali'` /
  `'Inter'`, `src: url('/fonts/<file>') format('woff2')`, matching `font-weight`,
  `font-display: swap`, matching `unicode-range`.
- Preload exactly two files in `src/app/layout.tsx` via
  `<link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous">`:
  `noto-sans-bengali-400-bengali.woff2` and `inter-400-latin.woff2`. Next.js hoists them
  into `<head>`. Do not preload the other weights — they load on demand.
- Tailwind `fontFamily.sans`: `['Noto Sans Bengali', 'Inter', 'system-ui', 'sans-serif']`.
- Tailwind `fontSize` (name → size / line-height / weight):
  - `xs` 12px/1.4, `sm` 14px/1.5, `base` 16px/1.6, `lg` 18px/1.6,
  - `xl` 20px/1.5/600, `2xl` 24px/1.4/700, `3xl` 28px/1.3/700.
- No letter-spacing or font-feature changes.

### 3. Shape and layout tokens

- `borderRadius`: `sm` 4px, `md` 8px, `lg` 12px, `xl` 16px, `full` 9999px; DEFAULT = `md`.
- `boxShadow` (tint is the `text-primary` channel):
  - `sm`: `0 1px 2px 0 rgb(26 26 26 / 0.05)` — cards
  - `md`: `0 2px 8px 0 rgb(26 26 26 / 0.08)` — dropdowns, modals
  - `lg`: `0 8px 24px 0 rgb(26 26 26 / 0.12)` — dialogs, overlays
- `screens` (min-width, overriding Tailwind defaults): `xs` 320, `sm` 480, `md` 640,
  `lg` 768, `xl` 1024, `2xl` 1280.
- `maxWidth`: `chat` 768px — `max-w-chat` replaces ui-context's now-banned
  `max-w-[768px]`.
- `spacing`: untouched (see design decisions).

### 4. Base styles — `globals.css`

- `@layer base`: `body` gets the sans font stack, `color: var(--color-text-primary)`,
  `background-color: var(--color-secondary-100)`.
- `:focus-visible`: `outline: 2px solid var(--color-primary-500); outline-offset: 2px;`.
  No `outline: none` anywhere.
- Nothing else. No dark-mode variants (declined in ui-context), no component classes, no
  layout.

### 5. Verification machinery

- `scripts/verify-tokens.mjs` — plain Node, built-ins only, exit non-zero on the first
  violation. Checks, in order:
  1. **Inventory**: every pinned token name from §1 exists in `globals.css` with a valid
     hex value.
  2. **Anchors**: pinned hexes match exactly.
  3. **Ramp constraints**: the five rules from §1.
  4. **Contrast** (WCAG relative luminance) for these pinned pairs:
     - ≥ 4.5:1 — `text-primary`, `text-secondary`, `text-muted` on `secondary-100` and on
       white; `text-inverse` on `primary-500`, `error`, `success`, `warning`, `info`;
       `text-primary` on `accent-400`; `success`, `error`, `warning`, `info` as text on
       `secondary-100`.
     - ≥ 3:1 — `primary-500` on white and on `secondary-100` (focus outline);
       `border-interactive` on white and on `secondary-100`.
     - Print every measured ratio so failures are self-explanatory.
  5. **Grep `src/**/*.{ts,tsx}` and `scripts/**`**: no hex colour literal
     (`#[0-9a-fA-F]{3,8}`) outside `globals.css`; no arbitrary-value Tailwind classes
     (`[a-z-]+-\[[^\]]+\]`).
- `package.json`: `"verify:tokens": "node scripts/verify-tokens.mjs"`.
- Tests: one test file in the Unit 01 test-runner style that executes
  `node scripts/verify-tokens.mjs` via `child_process` and asserts exit code 0, surfacing
  the script's output on failure.
- CI: add a `verify-tokens` job to the Unit 01 PR workflow running
  `npm run verify:tokens` (the token test also runs in the existing test job). No
  `continue-on-error`; it blocks merge.

## Non-goals

- No UI components, no shadcn/ui init (`components.json`, `cn()` helper), no
  component-level ring styling — Unit 04.
- No i18n setup, locale routing, or `<html lang>` handling — Unit 03. Do not touch `lang`.
- No dark mode — no dark tokens, no `.dark` variants, no `prefers-color-scheme` handling.
  Declined in ui-context, permanently.
- No layout implementation — no chat column, nav, or page structure. `maxWidth.chat` is a
  token definition only.
- No fonts via `next/font/google`, a CDN, or any runtime third-party request — ever.
- No new npm packages, no Tailwind version change, no CSS framework beyond what Unit 01
  installed.
- No CSP or header changes — fonts are same-origin. If a font is blocked, that is a Unit
  01 defect; fix it there, never by loosening the policy.
- Do not restyle the placeholder route; it only inherits the base styles.

## Security requirements

- The font and theme layer makes **zero requests to any third-party origin** — no Google
  Fonts pings, which keeps the font CDN from tracking which pages users visit.
- No secrets, credentials, or environment access anywhere in this unit.
- Same-origin fonts keep Unit 01's CSP (`default-src 'self'`) intact and strict.

## Verification checklist

- [ ] `npm run verify:tokens` exits 0 — inventory, anchors, ramp constraints, every pinned
      contrast pair, and the hex/arbitrary-value greps all pass, with measured ratios
      printed
- [ ] The token-verification test passes in the existing test run
- [ ] The CI workflow shows a `verify-tokens` job that runs on PRs and blocks merge (no
      `continue-on-error`)
- [ ] Introducing a violation — wrong anchor, hex in a component, arbitrary utility, or a
      sub-4.5:1 pair — makes the script exit non-zero: demonstrated locally, then reverted
- [ ] Dev server up: the placeholder page body computes to
      `background: rgb(245, 243, 240)` and `color: rgb(26, 26, 26)`, `font-family`
      starting with `"Noto Sans Bengali"`
- [ ] Browser Network tab: every font request is to `/fonts/*.woff2`; zero requests to
      `fonts.googleapis.com`, `fonts.gstatic.com`, or any third party
- [ ] Devtools: `document.fonts.check('16px "Noto Sans Bengali"')` and
      `document.fonts.check('16px Inter')` both return `true`
- [ ] A Bengali sample (e.g. `প্রশ্নপত্র ও সিলেবাস তৈরি করুন`) injected via devtools
      renders with correct conjuncts at 400/500/700, the weights visibly distinct, no
      tofu boxes
- [ ] `public/fonts/` holds the seven pinned woff2 files plus both OFL license files;
      `globals.css` has one `@font-face` per file with the correct weight and
      unicode-range
- [ ] Root layout contains exactly the two pinned font preloads with `crossorigin`
- [ ] Theme config maps: colours → `var(--color-*)` (with DEFAULT aliases), the sans
      stack, the seven font sizes with line-heights/weights, radii sm 4 / md 8 / lg 12 /
      xl 16 / full (DEFAULT = md), the three shadows, screens xs–2xl,
      `maxWidth.chat` 768px — and no `spacing` override
- [ ] `ui-context.md` updated: generated ramp values in the colour table,
      `text-muted` = `#6E6E6E`, `border-interactive` row, shadow values, `max-w-chat`
      wording (the last four are already applied as of this spec's writing)
- [ ] Typecheck passes; lint passes with zero errors and zero warnings; tests pass
- [ ] `context/progress-tracker.md` updated

## Dependencies

Unit 01 complete (scaffold, Tailwind, ESLint, CI workflow, test runner, placeholder route).
