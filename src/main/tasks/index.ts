/**
 * Public API of the `tasks` module — the only surface other processes see.
 */

export type { CompleteTaskResult } from "./domain/contracts/CompleteTaskResult";
export type { CreateTaskRequest } from "./domain/contracts/CreateTaskRequest";
export type { CreateTaskResult } from "./domain/contracts/CreateTaskResult";
export type { DeleteTaskResult } from "./domain/contracts/DeleteTaskResult";
export type { TasksCountResult } from "./domain/contracts/TasksCountResult";
export type { TasksErrorType } from "./domain/contracts/TasksFailure";
export type { TasksListResult } from "./domain/contracts/TasksListResult";
export type { UpdateTaskRequest } from "./domain/contracts/UpdateTaskRequest";
export type { UpdateTaskResult } from "./domain/contracts/UpdateTaskResult";
export type { UpdateTaskStatusResult } from "./domain/contracts/UpdateTaskStatusResult";
export type { TaskDTO } from "./domain/dtos/TaskDTO";
export type { KanbanStatusLevel } from "./domain/value-objects/KanbanStatus";
export { KANBAN_STATUS_LEVELS } from "./domain/value-objects/KanbanStatus";
export type { PriorityLevel } from "./domain/value-objects/Priority";
export { PRIORITY_LEVELS } from "./domain/value-objects/Priority";
export { taskTitleSchema } from "./domain/value-objects/TaskTitle";
