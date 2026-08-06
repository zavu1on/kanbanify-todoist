import type { Task } from "../../domain/entities/Task";
import type { KanbanStatusLevel } from "../../domain/value-objects/KanbanStatus";

/** One page of the free-tier 200-item pagination (see SPECIFICATION.md "Задачи") —
 * the single source for this shape, reused by the use-case output and the IPC contract. */
export interface TaskListPage {
  tasks: Task[];
  nextCursor: string | null;
}

export interface ITaskGateway {
  /** `projectId` scopes the list to one project — used both for the project
   * page's task list and for counting a project's active tasks (`ListProjectsUseCase`).
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  listTasks(
    accessToken: string,
    cursor: string | null,
    projectId?: string,
  ): Promise<TaskListPage>;

  /** @throws {import("../../domain/errors/TasksError").TasksError} */
  updateTaskStatus(
    accessToken: string,
    taskId: string,
    status: KanbanStatusLevel,
  ): Promise<Task>;
}
