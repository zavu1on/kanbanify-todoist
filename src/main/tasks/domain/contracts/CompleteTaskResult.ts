import type { TasksFailure } from "./TasksFailure";

/** The IPC-serializable shape of a `tasks:complete` call — no `TaskDTO` to
 * return, since Todoist's close endpoint reports success only (see
 * `ITaskGateway.close`). */
export type CompleteTaskResult = { ok: true } | TasksFailure;
