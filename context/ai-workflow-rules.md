# AI Workflow Rules

<!-- About agent behaviour, not about the product. Largely project-independent. -->

## One unit at a time

Work on exactly one feature unit per session. **Never combine unrelated system boundaries
in a single implementation step** — backend routes and the frontend consuming them are
separate units even when they serve the same feature. Combining them gives too much surface
area to make assumptions across, and assumptions are where drift starts.

If a spec seems to require touching an unrelated area, the spec is probably wrong. Raise it
rather than expanding scope.

## Stay in scope

- Implement what the spec says. Not more.
- If the spec says "do not add X yet" — do not add X. Not even a placeholder, not even
  "while I'm here."
- Refactoring unrelated code is out of scope by default. Note it in the tracker instead.

## Stop and ask

Stop, and ask, when:

- The spec is ambiguous on something that changes the design.
- An architectural decision is needed that is not already recorded.
- Following the spec would break an invariant.
- You need a library, service, or pattern the architecture file does not name.
- The task touches an open decision (D1–D5 in the overview).

**Do not guess and proceed.** A wrong guess that compiles is more expensive than a question,
because it survives review and gets built on.

## Before claiming a unit is done

1. Typecheck passes.
2. Lint passes.
3. Tests pass, including the ones you wrote for this unit.
4. Every verification-checklist item is actually verified, not assumed.
5. The progress tracker is updated.

If a check fails, **say so plainly and show the output.** Never report a unit complete when
a check failed. A build error you mention is a five-minute fix; one you paper over becomes
next week's debugging session.

## Debugging protocol

1. The problem goes into `context/current-issues.md` — reproduction steps, observed
   behaviour, expected behaviour.
2. **Analyse first.** Produce a diagnosis and proposed fix, and wait for a green light
   before executing.
3. Fix only the diagnosed cause. Do not opportunistically change adjacent code.
4. Verify against the original reproduction.

Never enter a fix-test-fix loop unsupervised. That is how one bug becomes five.

`context/current-issues.md` is gitignored. It will contain real error output, which contains
tokens, connection strings, and user data. Never commit it, never paste it into a PR.

## Consult the skills

Installed agent skills carry current API knowledge your training data lacks. When working
with a library that has one, **read it explicitly** — installing a skill does not make you
use it. Check the dependency manifest before writing framework-specific code. Version drift
is the most common source of error in agentic builds.

## Progress tracker discipline

After each unit, record:

- What moved and what state it is in.
- Any architectural decision made, and why.
- Anything that contradicts an existing context file — then **fix that file**, do not just
  note the contradiction.
- Anything deferred, in enough detail to pick up cold.

Write for someone opening this project in six months with no memory of the conversation.
That someone is probably you.

## Git

- Work on a development branch. The main branch is merged into via reviewed PR.
- One unit per commit, with a message saying what changed and why.
- **Never force-push a shared branch.**
- Never commit secrets, environment files, or `current-issues.md`.
