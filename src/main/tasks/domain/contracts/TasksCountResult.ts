import type { TasksFailure } from "./TasksFailure";

/** The IPC-serializable shape of a `tasks:count` call — total count of
 * Todoist-incomplete tasks, summed across the full 200-item pagination. */
export type TasksCountResult = { ok: true; count: number } | TasksFailure;
