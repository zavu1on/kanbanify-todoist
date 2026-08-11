/** Nested under the same `["tasks", "list"]` prefix as `tasksListQueryKey`
 * (`entities/task`) so every existing task mutation's fuzzy-prefix
 * `invalidateQueries` call already sweeps this cache too, with no changes to
 * those mutations. Kept local to this page — nothing outside `pages/calendar`
 * needs to read or write it. */
export const calendarTasksListQueryKey = ["tasks", "list", "calendar"] as const;
