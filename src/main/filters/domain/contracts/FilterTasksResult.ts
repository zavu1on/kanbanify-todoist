import type { TaskDTO } from "../../../tasks/domain/dtos/TaskDTO";
import type { FiltersFailure } from "./FiltersFailure";

/** The IPC-serializable shape of a `filters:tasks` call — one page of the
 * free-tier 200-item pagination (see SPECIFICATION.md "Ограничения тарифа"),
 * same shape as `tasks:list`'s `TasksListResult` but under this module's own
 * `FiltersFailure` (a filter's tasks page can fail for filter-specific reasons,
 * e.g. `not_found` when the filter was deleted, not just task-gateway reasons). */
export type FilterTasksResult =
  | { ok: true; tasks: TaskDTO[]; nextCursor: string | null }
  | FiltersFailure;
