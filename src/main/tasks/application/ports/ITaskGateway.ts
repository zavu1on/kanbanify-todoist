import type { Task } from "../../domain/entities/Task";

/** One page of the free-tier 200-item pagination (see SPECIFICATION.md "Задачи") —
 * the single source for this shape, reused by the use-case output. The IPC
 * contract (`TasksListResult`) carries `TaskDTO[]`, not this page as-is —
 * see BACKEND_CODE_STYLE_GUIDE.md "IPC-контракт". */
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
  getTask(accessToken: string, taskId: string): Promise<Task>;

  /** Persists this task's full label set (`task.rawLabels` — its non-reserved
   * labels plus the current status's reserved one, see `Task.changeStatus`).
   * Todoist's `updateTask` has no scoped "set labels" endpoint, so a kanban-status
   * change is a full label overwrite, not a partial patch.
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  save(accessToken: string, task: Task): Promise<Task>;
}
