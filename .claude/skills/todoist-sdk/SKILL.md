---
name: todoist-sdk
description: Reference for @doist/todoist-sdk (official TypeScript SDK for Todoist API v1) — client init, tasks/projects/labels, pagination, error handling. Use when writing code that calls the Todoist API in this project.
---

# Todoist SDK (TypeScript)

Reference for the [`@doist/todoist-sdk`](https://github.com/Doist/todoist-sdk-typescript) package — the one Kanbanify Todoist uses to talk to the Todoist API. Not the same as the raw REST API (`https://developer.todoist.com/api/v1/`) — the SDK renames some fields and wraps responses in its own shape.

**Source version:** `13.0.0` (commit `3e9a1f9a`, docs parsed from the GitHub repo on 2026-07-31). This skill is a snapshot at parse time. If the project's `package.json` version of `@doist/todoist-sdk` has drifted from this — **don't trust the signatures below**, re-read `node_modules/@doist/todoist-sdk` or the current GitHub repo and update this skill.

## When to use

- Writing code that calls the Todoist API (`TodoistApi` client, argument/response types).
- Need the exact method/field name, pagination behavior, or error shape.

## Scope

Deliberately limited to the domains Kanbanify Todoist actually needs (see `docs/SPECIFICATION.md`): **Tasks**, **Projects**, **Labels** (kanban statuses are stored as reserved labels), pagination, errors, client init.

The SDK covers much more (Sections, Comments, Reminders, Backups, Workspaces, Billing, Apps, UI Extensions, Webhooks, Insights, Templates, OAuth auth, etc.) — those domains are **not documented here** since the project doesn't use them (auth is via a personal Access Token, no OAuth flow). If a real need for one of these domains shows up, extend this skill with the matching `reference/*.md` — don't pre-build coverage for the whole SDK.

## Client init

```typescript
import { TodoistApi } from '@doist/todoist-sdk'

const api = new TodoistApi('YOUR_ACCESS_TOKEN')
```

Optional second argument is an options object (the old string-`baseUrl` signature was removed — passing a string throws `TypeError`):

```typescript
const api = new TodoistApi('YOUR_ACCESS_TOKEN', {
    baseUrl: 'https://custom-api.example.com', // optional, for proxying
    customFetch: myCustomFetch,                 // optional, for non-standard HTTP stacks (Electron/React Native/browser extensions)
})
```

The client is a thin wrapper: internally it delegates to sub-clients (`TaskClient`, `ProjectClient`, `LabelClient`, ...), but only `TodoistApi` itself is exported — sub-clients are not public.

## Error handling

Two error types, both exported from the package:

- **`TodoistRequestError`** — HTTP request error. Fields: `message`, `httpStatusCode?`, `responseData?`. `isAuthenticationError()` returns `true` for `401`/`403` — use it to tell "token invalid/expired" apart from other failures.
- **`TodoistArgumentError`** — SDK-side argument validation error (e.g. a task ID fails the internal Zod schema) — thrown *before* any network call.

```typescript
import { TodoistRequestError } from '@doist/todoist-sdk'

try {
    await api.getTask(id)
} catch (error) {
    if (error instanceof TodoistRequestError && error.isAuthenticationError()) {
        // token invalid — prompt the user to re-enter their Access Token
    }
    throw error
}
```

## Pagination (cursor-based)

Every listing method (`getTasks`, `getProjects`, `getLabels`, `getTasksByFilter`, ...) takes `{ cursor?: string | null; limit?: number }` and returns `{ results: T[]; nextCursor: string | null }`.

- `nextCursor === null` means this is the last page — nothing more to fetch.
- Todoist caps page size (the project's spec pins the limit at 200 — see `docs/SPECIFICATION.md`), so the "Tasks"/"Calendar" pages need a `nextCursor` load-more loop, not a single call.

```typescript
async function getAllTasks(api: TodoistApi, args: GetTasksArgs = {}) {
    const all: Task[] = []
    let cursor: string | null | undefined = args.cursor
    do {
        const { results, nextCursor } = await api.getTasks({ ...args, cursor })
        all.push(...results)
        cursor = nextCursor
    } while (cursor)
    return all
}
```

Domain-specific details live in `reference/`:

- [`reference/tasks.md`](reference/tasks.md) — task methods and types (CRUD, filters, subtasks, deadlines, moving)
- [`reference/projects.md`](reference/projects.md) — project methods and types
- [`reference/labels.md`](reference/labels.md) — label methods and types (the carrier of kanban status), available colors
