import type { TaskDTO } from "../dtos/TaskDTO";
import type { TasksFailure } from "./TasksFailure";

export type CreateTaskResult = { ok: true; task: TaskDTO } | TasksFailure;
