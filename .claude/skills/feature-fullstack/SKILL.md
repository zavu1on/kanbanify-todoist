---
name: feature-fullstack
description: Implements a feature that spans both processes — Todoist data or main-process logic plus the React UI that consumes it. Orchestrates the backend and frontend phases in one context around a single IPC contract. Use when a user-facing capability needs a new or changed IPC channel.
---

# Fullstack feature

Drives a feature that crosses the IPC boundary: main process first, renderer second, one shared contract between them.

The two phases reuse the existing skills — **read [`feature-backend`](../feature-backend/SKILL.md) at the start of phase 1 and [`feature-frontend`](../feature-frontend/SKILL.md) at the start of phase 2**, and follow each phase's pipeline as written there, including reading the corresponding code style guide. This file only adds what is specific to spanning both.

**Run both phases in this context, not in subagents.** The IPC contract is the shared state between the phases: a subagent would return a report instead of the type the renderer must import, and the seam is exactly where mistakes happen.

## Pipeline

### Step 0. Design the contract first

Before any code, agree on the seam and show it to the user:

- Channel name (`module:action`) and its arguments
- The shape of the discriminated union it returns — success payload plus each distinguishable error type
- Which fields the UI actually needs (do not ship the raw SDK shape across the boundary)

Everything else follows from this. Getting it wrong costs both phases.

Check `docs/SPECIFICATION.md` for the screen and for the domain traps in its "Ограничения тарифа" and "Доменная модель" sections — pagination in particular is a contract decision, not a UI detail: if the endpoint returns a list, the contract carries the cursor.

### Step 1. Backend phase

Run the `feature-backend` pipeline through its implementation and test steps, ending with the channel exposed on `window.api` in `src/preload/index.ts` and the contract type exported from the module barrel.

Do not run the backend hand-off step — the work isn't done yet.

Before moving on, run `yarn typecheck` once: the renderer imports these types, and a broken contract is cheaper to fix now.

### Step 2. Frontend phase

Run the `feature-frontend` pipeline. The contract now exists, so its "channel is missing → stop" condition does not apply.

Import the result type from `@/main/<module>` — never restate it on the frontend. Map each `error.type` from the contract to a user-facing message written on the frontend side (English, like the rest of the UI).

### Step 3. Joint SDLC gates

Run the project SDLC (`docs/COMMON_CODE_STYLE_GUIDE.md`, section "SDLC") once, over the whole change — step 3 (stale references, `docs/DEFERRED.md`), then:

1. Alias sync between `tsconfig.web.json` and `vitest.config.ts` if an alias was added
2. `yarn typecheck`
3. `yarn test`

`yarn format` runs automatically via the `PostToolUse` hook. Fix everything the gates report before reporting completion.

### Step 4. Hand off

Report the change as one feature: the contract, the backend files, the frontend files, and anything deliberately left out. Then stop for human review — **do not commit on your own initiative**. When the user asks for the commit, use the `git-commit` skill.

Offer the `code-reviewer` agent for a guide-compliance pass — for a fullstack change it is worth running, since it checks both guides and the boundary between them.
