/** Shared between `pages/tasks` (the query) and `features/change-task-status`
 * (optimistic cache writes) — kept in `entities` so both layers can import it
 * without reaching into each other's slice. */
export const tasksListQueryKey = ["tasks", "list"] as const;
