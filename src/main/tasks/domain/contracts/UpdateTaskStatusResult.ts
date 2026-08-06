import type { TaskDTO } from "../dtos/TaskDTO";
import type { TasksFailure } from "./TasksFailure";

/** The IPC-serializable shape of a `tasks:updateStatus` call — kanban column
 * drag-and-drop moves (see SPECIFICATION.md "Kanban-режим"). */
export type UpdateTaskStatusResult = { ok: true; task: TaskDTO } | TasksFailure;
