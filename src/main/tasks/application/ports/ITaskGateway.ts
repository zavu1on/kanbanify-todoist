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
   * `parentId` scopes the list to one task's direct subtasks — Todoist's
   * `getTasks` never returns completed tasks, so this doubles as "all
   * unfinished subtasks" with no extra filtering (see `ListTasksUseCase`).
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  listTasks(
    accessToken: string,
    cursor: string | null,
    projectId?: string,
    parentId?: string,
  ): Promise<TaskListPage>;

  /** Lists tasks matching a Todoist filter query (e.g. `!no date & !subtask`
   * for the Calendar page, see SPECIFICATION.md "Календарь") instead of the
   * fixed `projectId`/`parentId` scoping `listTasks` offers.
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  listTasksByFilter(
    accessToken: string,
    cursor: string | null,
    query: string,
  ): Promise<TaskListPage>;

  /** @throws {import("../../domain/errors/TasksError").TasksError} */
  getTask(accessToken: string, taskId: string): Promise<Task>;

  /** Creates a brand-new task via Todoist's add endpoint — `task.id` is empty
   * (see `Task.create`); the returned task carries the API-assigned id.
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  create(accessToken: string, task: Task): Promise<Task>;

  /** Persists this task's title, description, priority, due and full label set
   * (`task.rawLabels` — its non-reserved labels plus the current status's
   * reserved one, see `Task.changeStatus`). Todoist's `updateTask` has no scoped
   * "set labels" endpoint, so a kanban-status change is a full label overwrite,
   * not a partial patch. Does not persist `projectId` — Todoist's `updateTask`
   * has no such field (see `move`).
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  save(accessToken: string, task: Task): Promise<Task>;

  /** Moves a task to a different project via Todoist's dedicated move endpoint —
   * `projectId` isn't settable through `updateTask`, so this is separate from `save`.
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  move(accessToken: string, taskId: string, projectId: string): Promise<Task>;

  /** Completes a task via Todoist's dedicated close endpoint — `checked` isn't
   * settable through `updateTask`, so this is separate from `save`.
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  close(accessToken: string, taskId: string): Promise<void>;

  /** Deletes a task outright via Todoist's dedicated delete endpoint.
   * @throws {import("../../domain/errors/TasksError").TasksError} */
  delete(accessToken: string, taskId: string): Promise<void>;
}
