import type { TaskDTO } from "../dtos/TaskDTO";
import type { TasksFailure } from "./TasksFailure";

/** The IPC-serializable shape of a `tasks:list` call — one page of the free-tier
 * 200-item pagination, cursor-based (see SPECIFICATION.md "Задачи"). */
export type TasksListResult =
  | { ok: true; tasks: TaskDTO[]; nextCursor: string | null }
  | TasksFailure;
