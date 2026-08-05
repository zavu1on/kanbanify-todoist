import { TodoistApi } from "@doist/todoist-sdk";
import type {
  ITaskGateway,
  TaskListPage,
} from "../application/ports/ITaskGateway";
import type { Task } from "../domain/entities/Task";
import { TaskMapper } from "../domain/mappers/TaskMapper";
import type { KanbanStatusLevel } from "../domain/value-objects/KanbanStatus";
import { KanbanStatus } from "../domain/value-objects/KanbanStatus";
import { TodoistTasksErrorClassifier } from "./TodoistTasksErrorClassifier";

/** Todoist caps list pages at 200 (see SPECIFICATION.md "Задачи"). */
const PAGE_SIZE = 200;

export class TodoistTaskGateway implements ITaskGateway {
  private readonly taskMapper = new TaskMapper();
  private readonly errorClassifier = new TodoistTasksErrorClassifier();

  async listTasks(
    accessToken: string,
    cursor: string | null,
  ): Promise<TaskListPage> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const { results, nextCursor } = await api.getTasks({
        cursor,
        limit: PAGE_SIZE,
      });

      return {
        tasks: results.map((task) => this.taskMapper.toDomain(task)),
        nextCursor,
      };
    });
  }

  async updateTaskStatus(
    accessToken: string,
    taskId: string,
    status: KanbanStatusLevel,
  ): Promise<Task> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      // Reserved labels carry kanban status, so changing it is read-modify-write
      // on the label list, preserving every other label already on the task.
      const current = await api.getTask(taskId);
      const labels = KanbanStatus.of(status).applyTo(current.labels);
      const updated = await api.updateTask(taskId, { labels });

      return this.taskMapper.toDomain(updated);
    });
  }
}
