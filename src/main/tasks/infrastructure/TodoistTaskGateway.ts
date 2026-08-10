import { TodoistApi } from "@doist/todoist-sdk";
import type {
  ITaskGateway,
  TaskListPage,
} from "../application/ports/ITaskGateway";
import type { Task } from "../domain/entities/Task";
import { TaskMapper } from "../domain/mappers/TaskMapper";
import { TodoistTasksErrorClassifier } from "./TodoistTasksErrorClassifier";

/** Todoist caps list pages at 200 (see SPECIFICATION.md "Задачи"). */
const PAGE_SIZE = 200;

export class TodoistTaskGateway implements ITaskGateway {
  private readonly taskMapper = new TaskMapper();
  private readonly errorClassifier = new TodoistTasksErrorClassifier();

  async listTasks(
    accessToken: string,
    cursor: string | null,
    projectId?: string,
    parentId?: string,
  ): Promise<TaskListPage> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const { results, nextCursor } = await api.getTasks({
        cursor,
        limit: PAGE_SIZE,
        projectId,
        parentId,
      });

      return {
        tasks: results.map((task) => this.taskMapper.toDomain(task)),
        nextCursor,
      };
    });
  }

  async getTask(accessToken: string, taskId: string): Promise<Task> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const task = await api.getTask(taskId);
      return this.taskMapper.toDomain(task);
    });
  }

  async create(accessToken: string, task: Task): Promise<Task> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const base = {
        content: task.title,
        description: task.description,
        projectId: task.projectId,
        priority: task.priority.toApiValue(),
        labels: task.rawLabels,
        // `AddTaskArgs.parentId` is `string | undefined`, not `string | null` —
        // omit the key entirely for a top-level task rather than pass `null`.
        ...(task.parentId ? { parentId: task.parentId } : {}),
      };
      // `AddTaskArgs.dueDate`/`dueDatetime` are mutually exclusive (see
      // `TaskDue`'s doc comment) — the SDK's XOR type only accepts an object
      // literal with exactly one of the two keys present, so each branch
      // builds its own literal rather than spreading a shared value.
      const created = task.due?.datetime
        ? await api.addTask({ ...base, dueDatetime: task.due.datetime })
        : task.due
          ? await api.addTask({ ...base, dueDate: task.due.date })
          : await api.addTask(base);
      return this.taskMapper.toDomain(created);
    });
  }

  async save(accessToken: string, task: Task): Promise<Task> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const base = {
        content: task.title,
        description: task.description,
        priority: task.priority.toApiValue(),
        labels: task.rawLabels,
      };
      // Same XOR constraint as `create` — plus `dueString: null`, the SDK's
      // alias for clearing the due date, since an omitted `due*` field means
      // "leave unchanged", not "clear" (see `ITaskGateway.save`'s doc comment).
      const updated = task.due?.datetime
        ? await api.updateTask(task.id, {
            ...base,
            dueDatetime: task.due.datetime,
          })
        : task.due
          ? await api.updateTask(task.id, { ...base, dueDate: task.due.date })
          : await api.updateTask(task.id, { ...base, dueString: null });
      return this.taskMapper.toDomain(updated);
    });
  }

  async move(
    accessToken: string,
    taskId: string,
    projectId: string,
  ): Promise<Task> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const moved = await api.moveTask(taskId, { projectId });
      return this.taskMapper.toDomain(moved);
    });
  }

  async close(accessToken: string, taskId: string): Promise<void> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      await api.closeTask(taskId);
    });
  }

  async delete(accessToken: string, taskId: string): Promise<void> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      await api.deleteTask(taskId);
    });
  }
}
