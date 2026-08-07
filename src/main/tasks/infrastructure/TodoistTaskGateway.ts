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
  ): Promise<TaskListPage> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const { results, nextCursor } = await api.getTasks({
        cursor,
        limit: PAGE_SIZE,
        projectId,
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

  async save(accessToken: string, task: Task): Promise<Task> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const updated = await api.updateTask(task.id, {
        labels: task.rawLabels,
      });
      return this.taskMapper.toDomain(updated);
    });
  }

  async close(accessToken: string, taskId: string): Promise<void> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      await api.closeTask(taskId);
    });
  }
}
