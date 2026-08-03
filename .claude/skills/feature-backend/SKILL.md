---
name: feature-backend
description: Implements a feature or fix in the Electron main/preload processes (src/main, src/preload) following the project's clean-architecture guide. Use when the work touches domain logic, use cases, Todoist API access, token storage, or the IPC contract — and not the React UI.
---

# Backend feature

Drives a feature or fix in `src/main/` and `src/preload/` from clarification to a review-ready diff.

**This skill is the process. The conventions live in [`docs/BACKEND_CODE_STYLE_GUIDE.md`](../../../docs/BACKEND_CODE_STYLE_GUIDE.md)** — read that file in full before writing code, every run. Never restate its rules from memory: if this skill and the guide disagree, the guide wins and this skill is stale.

## When not to use

- Work touches React UI → `feature-frontend`
- Work spans both processes (new user-facing capability that needs data from Todoist) → `feature-fullstack`, which drives this skill as its first phase

## Pipeline

### Step 1. Read the context

Always, in this order:

1. `docs/BACKEND_CODE_STYLE_GUIDE.md` — architecture, naming, IPC contract, the step-by-step recipe, the "чего делать нельзя" list
2. The relevant section of `docs/SPECIFICATION.md` — what the feature must do, plus the domain traps (inverted priority, reserved labels as kanban statuses, free-tier-only fields, 200-item pagination)
3. `docs/DEFERRED.md` — deferred work waiting on missing functionality. Check whether this feature unblocks any row; if it does, do it in the same change or tell the user why not
4. An existing module as the working example — `src/main/auth/` is currently the only complete one; mirror its layer layout

If the feature calls the Todoist API, also invoke the `todoist-sdk` skill for exact method signatures, pagination and error shapes. Do not write SDK calls from memory.

### Step 2. Clarify before coding

Ask the user only about what changes the outcome and cannot be resolved from the spec or the code:

- Which module does this belong to — an existing one or a new one?
- What are the distinguishable failure modes the UI must react to differently? (each one becomes a domain error + a member of the error union)
- Does anything here need a decision recorded as an ADR (new dependency, new architectural pattern)?

If the spec answers it, don't ask. State the assumption and continue.

### Step 3. Plan the file list

Before editing, write out the concrete file list in the order given by the guide's recipe (domain → application → infrastructure → barrel → DI → preload). Show it to the user as a short list. This is the cheapest place to catch a layering mistake.

### Step 4. Implement

Follow the recipe and the naming rules from the guide. Non-negotiables worth re-checking as you go:

- Dependency rule points inward only; `domain/` and `application/` never import `electron` or the SDK
- Errors never cross the IPC boundary as exceptions — the controller returns a serializable discriminated union
- Types shared with the renderer live in `domain/contracts/` and are exported through the module barrel; the frontend never defines its own copy
- Dependencies are assembled by hand in `src/main/index.ts` only
- Code, comments and error messages in English

### Step 5. Tests

Add or update `*.spec.ts` next to the code under test. Mock ports directly when testing a use case, and `vi.mock("electron", ...)` for anything touching the Electron runtime — Electron is not running under Vitest. See the guide's "Тестирование" section.

### Step 6. SDLC gates

Run the project SDLC (the guide's "SDLC" section):

1. Check for stale references — does `docs/README.md`, `CLAUDE.md` or an ADR need an update? Does a new decision need one?
2. Update `docs/DEFERRED.md` — delete rows this change resolved, add a row for anything you deliberately left out because the functionality it depends on does not exist yet
3. `yarn typecheck`
4. `yarn test`

`yarn format` runs automatically via the `PostToolUse` hook on every edit, so don't run it by hand unless the hook reported a failure. Fix everything these gates report before reporting completion — a red gate is not a finding to hand off, it's work.

### Step 7. Hand off

Report what changed, which files, and anything you deliberately left out. Then stop for human review — **do not commit on your own initiative**. When the user asks for the commit, use the `git-commit` skill.

Optionally offer the `code-reviewer` agent for a guide-compliance pass before review.
