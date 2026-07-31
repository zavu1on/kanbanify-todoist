# Tasks

All methods are on `api: TodoistApi`. `Task` (see the `Task` schema) contains: `id`, `userId`, `projectId`, `sectionId`, `parentId`, `labels: string[]`, `content`, `description`, `priority`, `due`, `deadline`, `duration`, `checked`, `isDeleted`, `childOrder`, `dayOrder`, `isCollapsed`, `isUncompletable`, `url`, `addedAt`/`completedAt`/`updatedAt` (`Date | null`).

Note: `checked` (Todoist's "done" status) is **not** the same as this project's kanban status. Kanban status lives in `labels` as a reserved tag, independent of `checked`.

## Reading

### `getTask(id: string): Promise<Task>`
A single active (not completed) task by ID.

### `getTasks(args?: GetTasksArgs): Promise<GetTasksResponse>`
```typescript
type GetTasksArgs = {
    projectId?: string
    sectionId?: string
    parentId?: string
    label?: string        // filter by label name — useful for kanban columns
    ids?: string[]
    cursor?: string | null
    limit?: number
}
type GetTasksResponse = { results: Task[]; nextCursor: string | null }
```

### `getTasksByFilter(args: GetTasksByFilterArgs): Promise<GetTasksResponse>`
```typescript
type GetTasksByFilterArgs = { query: string; lang?: string; cursor?: string | null; limit?: number }
```
`query` uses Todoist filter syntax (`today`, `overdue`, `p1 & @label`, ...). Useful for "Today"/"Calendar" instead of filtering client-side.

### Completed tasks
Three separate methods depending on which date you filter/search by — `getCompletedTasksByCompletionDate`, `getCompletedTasksByDueDate`, `searchCompletedTasks`. Each takes `since`/`until` (required ISO strings for the first two) and returns `{ items: Task[]; nextCursor: string | null }` (the field is `items`, not `results`, unlike the other listing methods).

`getAllCompletedTasks(args?)` — legacy endpoint, returns `{ projects, sections, items }` without cursor pagination (offset/limit, default limit 30, max 200). Prefer the methods above for new code.

## Creating and updating

### `addTask(args: AddTaskArgs, requestId?: string): Promise<Task>`
```typescript
type AddTaskArgs = {
    content: string
    description?: string
    projectId?: string
    sectionId?: string
    parentId?: string       // subtask
    order?: number
    labels?: string[]
    priority?: number
    assigneeId?: string
    dueString?: string      // natural language: "tomorrow at 12:00"
    dueDate?: string        // XOR with dueDatetime (RequireOneOrNone)
    dueDatetime?: string
    dueLang?: string
    deadlineDate?: string
    deadlineLang?: string
    duration?: number        // requires durationUnit and vice versa (RequireAllOrNone)
    durationUnit?: 'minute' | 'day'
    isUncompletable?: boolean
}
```
`requestId` — optional idempotency key for retries on flaky networks.

### `updateTask(id: string, args: UpdateTaskArgs, requestId?: string): Promise<Task>`
Same fields as `AddTaskArgs` minus `content`/`projectId`/`sectionId`/`parentId` (use `moveTask` for those), plus:
- `dueString: null` — SDK alias for clearing the due date (translated to `"no date"` before sending).
- `order` is remapped to `childOrder`/`child_order` under the hood — still pass `order` in the argument.
- `deadlineDate: null` clears the task deadline.

### `quickAddTask(args: QuickAddTaskArgs): Promise<Task>`
Todoist quick-add syntax in one line (`text`), with dates/labels/projects via `#project @label` etc. — parsed server-side.

### Moving
- `moveTask(id: string, args: MoveTaskArgs, requestId?): Promise<Task>` — single task.
- `moveTasks(ids: string[], args: MoveTaskArgs, requestId?): Promise<Task[]>` — up to 100 tasks at once (otherwise `TodoistRequestError` before any network call), via the Sync API (`item_move`).

```typescript
type MoveTaskArgs = RequireExactlyOne<{ projectId?: string; sectionId?: string; parentId?: string }>
```
Exactly one of the three fields — also used to change kanban column if a column maps to `sectionId`, but in this project's model kanban status is a label, not a section, so changing status is usually just `updateTask({ labels })`, not `moveTask`.

### Lifecycle (Todoist `checked`, not kanban status)
- `closeTask(id: string, requestId?): Promise<boolean>` — mark done.
- `reopenTask(id: string, requestId?): Promise<boolean>` — return to active.
- `deleteTask(id: string, requestId?): Promise<boolean>` — delete outright.

## `isUncompletable`

SDK quirk: `isUncompletable` isn't a Todoist API field directly — the SDK encodes it as a prefix in `content` and decodes it back on read (see `TaskSchema.transform` and `processTaskContent`). No need to parse content manually — read/write through this field.
