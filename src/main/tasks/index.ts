/**
 * Public API of the `tasks` module — the only surface other processes see.
 */

export type { TasksCountResult } from "./domain/contracts/TasksCountResult";
export type { TasksErrorType } from "./domain/contracts/TasksFailure";
export type { TasksListResult } from "./domain/contracts/TasksListResult";
export type { UpdateTaskStatusResult } from "./domain/contracts/UpdateTaskStatusResult";
export type { Task } from "./domain/entities/Task";
export type { KanbanStatusLevel } from "./domain/value-objects/KanbanStatus";
export { KANBAN_STATUS_LEVELS } from "./domain/value-objects/KanbanStatus";
export type { PriorityLevel } from "./domain/value-objects/Priority";
export type { TaskDue } from "./domain/value-objects/TaskDue";
