/** Free tier caps saved filters low (see SPECIFICATION.md "Ограничения
 * тарифа" — 3 for Todoist's own filters; this app's local filters aren't
 * that entity, but the list is small the same way projects/labels are), so
 * this is a plain list key, not paginated. */
export const filtersListQueryKey = ["filters", "list"] as const;

/** A filter's own tasks page — deliberately nested under the same
 * `["tasks", "list"]` prefix as every other tasks list (`tasksListQueryKey`
 * in `entities/task`), not under `["filters", ...]`: mutating a task from
 * any screen (complete, edit, status change) already invalidates that whole
 * prefix, and this rides along for free instead of needing its own
 * invalidation call wired into every task mutation. */
export const filterTasksListQueryKey = (filterId: number) =>
  ["tasks", "list", "filter", filterId] as const;
