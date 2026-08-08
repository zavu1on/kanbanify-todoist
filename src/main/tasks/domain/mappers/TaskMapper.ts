import type { TaskDTO } from "../dtos/TaskDTO";
import { Task } from "../entities/Task";
import { Priority } from "../value-objects/Priority";
import { TaskDue } from "../value-objects/TaskDue";

/** The subset of the Todoist API task shape this app reads — kept structural
 * (not the SDK's own type) so this mapper stays free of an SDK import. */
export type TaskApiSource = {
  id: string;
  content: string;
  description: string;
  projectId: string;
  priority: number;
  due: { date: string; datetime?: string | null } | null;
  labels: string[];
  checked: boolean;
};

/**
 * Maps a raw Todoist API task into the domain `Task` — resolving kanban status
 * and priority off the wire format is domain logic, so it lives in `Task`
 * (see `Task.reconstitute`), not here.
 */
export class TaskMapper {
  toDomain(source: TaskApiSource): Task {
    return Task.reconstitute({
      id: source.id,
      title: source.content,
      description: source.description,
      projectId: source.projectId,
      priority: Priority.fromApiValue(source.priority),
      due: source.due
        ? TaskDue.of(source.due.date, source.due.datetime ?? null)
        : null,
      rawLabels: source.labels,
      checked: source.checked,
    });
  }

  /** `kanbanStatus` is a prototype getter on `Task`, so Electron's IPC transport
   * (structured clone) would drop it — this is the plain shape that actually
   * survives the trip to the renderer. */
  toDTO(task: Task): TaskDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      priority: task.priority.level,
      due: task.due
        ? { date: task.due.date, datetime: task.due.datetime }
        : null,
      kanbanStatus: {
        level: task.kanbanStatus.level,
        hasConflict: task.kanbanStatus.hasConflict,
      },
      labels: task.labels,
      checked: task.checked,
    };
  }
}
