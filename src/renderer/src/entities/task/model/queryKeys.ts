/** Shared between `pages/tasks` (the query) and `features/change-task-status`
 * (optimistic cache writes) — kept in `entities` so both layers can import it
 * without reaching into each other's slice. Also doubles as the fuzzy-match
 * prefix every `projectTasksListQueryKey` shares, so `useChangeTaskStatusMutation`
 * can invalidate every tasks-list page (global and per-project) with one call. */
export const tasksListQueryKey = ["tasks", "list"] as const;

/** Separate cache entry per project page — kept distinct from `tasksListQueryKey`
 * (the all-tasks "Tasks" page) so the mutated page's own optimistic write
 * targets the right cache entry; still nested under the same `["tasks", "list"]`
 * prefix so cross-page invalidation (see above) reaches it too. */
export const projectTasksListQueryKey = (projectId: string) =>
  ["tasks", "list", "project", projectId] as const;

/** The Today page's own cache entry (SPECIFICATION.md "Сегодня") — nested
 * under the same `["tasks", "list"]` prefix so mutating a task from any
 * other screen (complete, edit, status/due change) is swept up by the
 * blanket `tasksListQueryKey` invalidation too. */
export const todayTasksListQueryKey = ["tasks", "list", "today"] as const;

/** A task's own direct subtasks, as shown in its detail modal — nested under
 * the same `["tasks", "list"]` prefix so mutating a subtask (complete, edit,
 * delete) is swept up by the blanket `tasksListQueryKey` invalidation too. */
export const subtasksListQueryKey = (parentId: string) =>
  ["tasks", "list", "subtasks", parentId] as const;
