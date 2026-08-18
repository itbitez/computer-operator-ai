# UI Context

## Source of truth

No prior design exists. This file defines the system.

## Design direction

Credible, professional, and calm — it must read as a serious tool to a coaching center
owner who is trusting it with commercial IP. Deep green anchors it in Bangladesh's
institutional palette; warm gray keeps long chat sessions easy on the eyes; amber marks
premium interactive moments. Mobile-first, single-column, WhatsApp-familiar.

Avoid the generic-AI-output tells: no unmotivated gradients, no oversized heroes, no
decorative flourish, no dark mode (content focus), no playful illustration. When in doubt,
restrain.

## Colour tokens

Every colour is a named token mapped into the Tailwind theme. Components reference the
name, never the value. Full ramp in CSS custom properties; anchors below.

| Token | Value | Purpose |
|---|---|---|
| `primary-500` | `#006A4E` | Anchor green — primary actions, brand, active states |
| `primary-50…900` | ramp | Green scale for hovers, focus rings, tints |
| `secondary-100` | `#F5F3F0` | Warm gray app background |
| `secondary-50…900` | ramp | Surfaces, borders, neutral text |
| `accent-400` | `#D4A02B` | Amber — highlights, premium moments, processing states |
| `accent-50…900` | ramp | Amber scale |
| `success` / `error` / `warning` / `info` | `#0F7B3A` / `#B91C1C` / `#B45309` / `#1C6FB4` | Semantic states |
| `text-primary` / `text-secondary` / `text-muted` / `text-inverse` | `#1A1A1A` / `#4A4A4A` / `#8A8A8A` / `#FFFFFF` | Text hierarchy (never pure black for body) |
| `border-light` / `border-medium` / `border-heavy` | `#E5E2DE` / `#D6D0C8` / `#BDB5AB` | Borders |

## Typography

Self-hosted — no runtime third-party font requests. `Noto Sans Bengali` (400/500/700) is
the primary family for Bangla; `Inter` (400) is the Latin fallback. Stack:
`'Noto Sans Bengali', 'Inter', system-ui, sans-serif`. Loaded via `@font-face` with
`font-display: swap` from `/fonts/`.

Scale: `xs 12/1.4`, `sm 14/1.5`, `base 16/1.6` (chat body), `lg 18/1.6` (section titles),
`xl 20/1.5 600` (card titles), `2xl 24/1.4 700` (page headings), `3xl 28/1.3 700`
(landing hero). Generous line height — Bengali diacritics need breathing room.

## Spacing, radius, shadow

Spacing on an 8px scale via Tailwind defaults: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
Radii: `sm 4px` (buttons, inputs), `md 8px` (cards, chat bubbles), `lg 12px` (modals),
`xl 16px` (large containers), `full` (avatars, badges). Shadows, three named levels:
`sm` (cards), `md` (dropdowns, modals), `lg` (dialogs, overlays) — subtle, low opacity.

**No raw values in components, and no arbitrary utility values.** Extend the theme.

## Components

Shared components that must never be rebuilt per screen, in `components/`:

- `Navbar` (server) — logo, language toggle, user avatar + subscription status dot, menu.
  Active state set per instance by the route, never baked in.
- `ChatThread` + `MessageComposer` — **the single chat pair**; one instance in the app.
  User bubbles right (green), AI bubbles left (surface), document download cards embedded
  in AI messages.
- `VoiceInputButton` (client) — mic with recording state, consent tooltip
  (Google-servers disclosure), `aria-pressed`, screen-reader announcements.
- `DocumentCard` — filename, date, size, download, delete; renders only what it is passed.
- `SubscriptionBanner` (server, reads session) — read-only-mode renewal banner above the
  composer.
- `PricingCard` — plan, price in Bangla numerals, features, subscribe CTA.
- `AdminAuditAccessDialog` — reason required, one-time token, audited banner.
- UI primitives: `Button`, `Input`, `Modal` (focus-trapped, `aria-modal`), `Toast`
  (`role="alert"`), `Badge` (semantic colors), `LoadingSpinner` (named `aria-label`).

## Internationalisation

Bangla (`bn`) primary, English (`en`) fallback, `defaultLocale: bn`. Bangla numerals
(`১২৩`) in Bangla UI; English numerals in English UI; `৳` currency symbol in both.
`<html lang>` switches on locale change. The AI system prompt is Bangla regardless of UI
language. All strings live in `public/locales/{bn,en}/common.json`.

## Layout

Mobile-first, single-column, WhatsApp-style chat — even on desktop. Breakpoints:
`xs 320`, `sm 480`, `md 640`, `lg 768`, `xl 1024`, `2xl 1280`. Chat column is full-width
below `lg`, `max-w-[768px]` centered above. There is **no documents sidebar**; history is
a separate view reached from the chat header. Do not invent layouts beyond this — the
single-column decision is deliberate and approved.

## Accessibility

Bar: **WCAG 2.1 AA**, verified by axe-core in CI plus manual keyboard/visual checks.

- Every icon-only control carries an accessible name. `title` is not a dependable label.
- Full keyboard reachability with visible focus states (`:focus-visible`, ring contrast
  ≥ 3:1). Every action performable with Enter/Space.
- Text contrast ≥ 4.5:1 (large text 3:1); interactive elements ≥ 3:1 against adjacent
  colors; all token pairs checked.
- ARIA landmarks (`banner`, `main`, `dialog`); modals trap focus and restore it on close.
- Form and toast errors announced via `aria-live="polite"` / `role="alert"`.
- Voice input: consent tooltip is focusable and keyboard-operable; recording state
  announced; permission denial disables the button with an announced error.
- Closed off-screen panels removed from focus order and from assistive technology.
- Correct `lang` attribute on locale switch.
