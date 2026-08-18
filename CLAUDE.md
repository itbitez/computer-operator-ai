# CLAUDE.md — Computer Operator AI

> Copy of `AGENTS.md`. Same content.
> This is the entry point. Read it fully before doing anything.

## Before you write any code

Read these, in this order:

1. `context/project-overview.md` — what this is, who it serves, what is out of scope
2. `context/architecture.md` — the stack, the boundaries, and the invariants
3. `context/code-standards.md` — how code in this repo is written
4. `context/ai-workflow-rules.md` — how you are expected to work
5. `context/ui-context.md` — design tokens and component conventions
6. `context/progress-tracker.md` — where the build actually stands right now

Then read the feature spec you were asked to implement, in `context/feature-specs/`.

Do not skip this because the task looks small. Reading costs far less than an
implementation that contradicts a decision already made.

## After every change

Update `context/progress-tracker.md`. Record what moved and any architectural decision you
made that was not already written down. It is the only memory this project has between
sessions.

## Non-negotiables

This is a production system handling users' commercial intellectual property (coaching
documents and command history), real bKash payments, and mobile numbers. Not a demo.

- One feature unit per session. Never combine unrelated system boundaries.
- If a spec is ambiguous, or an architectural decision is needed that is not already
  recorded — **stop and ask.** Do not guess and proceed.
- Never introduce a library, service, or pattern that `context/architecture.md` does not name.
- `context/current-issues.md` is gitignored and may contain real error output, tokens, or
  user data. Never commit it. Never paste its contents into a PR.

## Precedence

When sources conflict: this project's `context/` files and invariants win, then any skill
or plugin, then your priors. No skill overrides an invariant.

## Framework versions

Your training data is likely older than what is installed here. Check `package.json` and
read the installed documentation or the relevant agent skill before writing
framework-specific code. Version drift is the most common source of error in agentic builds.
