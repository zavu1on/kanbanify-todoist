import type { TaskDTO } from "../dtos/TaskDTO";
import type { TasksFailure } from "./TasksFailure";

export type UpdateTaskResult = { ok: true; task: TaskDTO } | TasksFailure;
