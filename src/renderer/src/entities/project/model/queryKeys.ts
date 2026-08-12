/** Shared between `widgets/sidebar` (the query), `entities/task` (project lookup
 * for the "#project" chip) and `pages/tasks` (project page title/task list). */
export const projectsListQueryKey = ["projects", "list"] as const;

/** Single-project lookup — `pages/tasks` uses this for a project page's
 * title instead of loading the whole list just to `find` one entry. */
export const projectQueryKey = (id: string) => ["projects", "get", id] as const;
