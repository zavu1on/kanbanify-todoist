---
name: feature-frontend
description: Implements a feature or fix in the Electron renderer (src/renderer) following the project's FSD guide — slices, Mantine UI, forms, IPC calls through api/, Vitest specs. Use when the work touches React UI and not the main process.
---

# Frontend feature

Drives a feature or fix in `src/renderer/src/` from clarification to a review-ready diff.

**This skill is the process. The conventions live in [`docs/FRONTEND_CODE_STYLE_GUIDE.md`](../../../docs/FRONTEND_CODE_STYLE_GUIDE.md)** — read that file in full before writing code, every run. Never restate its rules from memory: if this skill and the guide disagree, the guide wins and this skill is stale.

## When not to use

- Work needs new data from Todoist, a new IPC channel or main-process logic → `feature-fullstack` (or `feature-backend` if there is no UI part)

## Pipeline

### Step 1. Read the context

Always, in this order:

1. `docs/FRONTEND_CODE_STYLE_GUIDE.md` — layers, slice structure, Mantine rules, forms/IPC, routing, state policy, the "чего делать нельзя" list — plus `docs/COMMON_CODE_STYLE_GUIDE.md`, which it references for the cross-process rules
2. The relevant screen description in `docs/SPECIFICATION.md` — behaviour, states, edge cases
3. `docs/DEFERRED.md` — deferred work waiting on missing functionality. Check whether this feature unblocks any row; if it does, do it in the same change or tell the user why not
4. `src/renderer/src/pages/tasks/` as the working example of a complete slice (`ui/` + `model/` + `api/` + barrel + specs)
5. The backend contract you will consume: the module barrel in `src/main/<module>/index.ts` and what `src/preload/index.ts` actually exposes on `window.api`

If the channel you need is missing from `window.api`, stop — that is backend work, switch to `feature-fullstack`.

### Step 2. Clarify before coding

Ask only what changes the outcome:

- Which FSD layer does this belong to? (propose one with a reason; ask only if genuinely ambiguous)
- What should the user see in the loading, empty and error states?
- Does this need a state-management or caching library? If yes — stop and agree on an ADR first, per the guide's "Загрузка данных и состояние".

### Step 3. Plan the slice

Before editing, list the concrete files: slice path, `ui/` components, `api/` calls and hooks, `model/` functions, barrel, specs, and where the slice gets mounted (page, widget or router). Show it to the user.

### Step 4. Implement

Follow the guide's recipe. Non-negotiables worth re-checking as you go:

- Components never call `window.api` directly — always through an `api/` function or one of its TanStack Query hooks; `model/` is for non-UI logic that does not touch IPC
- IPC results are discriminated unions handled with `if (result.ok)`, never `try/catch` over a throw
- Zod schemas shared with the backend are imported from `@/main/*`, never re-declared
- Cross-slice imports go through `index.ts` and only downward through layers
- Layout and spacing via Mantine props, not inline styles
- Everything in the code is English, including user-facing text — Russian belongs to the documentation only

For any Mantine component's props or behaviour, query the `mantine` MCP server instead of recalling the API — it changes between major versions.

### Step 5. Tests

Add or update `*.spec.tsx` next to the component. Drive them through user-visible affordances (`getByRole`, `getByLabelText`), mock `window.api` per spec file with only the methods that component uses, and remember the globals set up in `vitest.setup.ts` (`screen` is the one you still import). See the guide's "Тестирование" section.

### Step 6. SDLC gates

Run the project SDLC (`docs/COMMON_CODE_STYLE_GUIDE.md`, section "SDLC") — step 3 (stale references, `docs/DEFERRED.md`), then:

1. If an alias was added, `tsconfig.web.json` and `vitest.config.ts` must be in sync
2. `yarn typecheck`
3. `yarn test`

`yarn format` runs automatically via the `PostToolUse` hook on every edit, so don't run it by hand unless the hook reported a failure. Fix everything these gates report before reporting completion.

### Step 7. Hand off

Report what changed, which files, and anything you deliberately left out. Then stop for human review — **do not commit on your own initiative**. When the user asks for the commit, use the `git-commit` skill.

Optionally offer the `code-reviewer` agent for a guide-compliance pass before review.
