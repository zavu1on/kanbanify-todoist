import { Task } from "../entities/Task";
import { KanbanStatus } from "../value-objects/KanbanStatus";
import { Priority } from "../value-objects/Priority";
import { TaskDue } from "../value-objects/TaskDue";

/** The subset of the Todoist API task shape this app reads — kept structural
 * (not the SDK's own type) so this mapper stays free of an SDK import. */
export type TaskApiSource = {
  id: string;
  content: string;
  projectId: string;
  priority: number;
  due: { date: string; datetime?: string | null } | null;
  labels: string[];
};

/**
 * Maps a raw Todoist API task into the domain `Task` — resolving kanban status
 * and priority off the wire format is domain logic, so it lives here rather
 * than in the infrastructure gateway that fetches the raw task.
 */
export class TaskMapper {
  toDomain(source: TaskApiSource): Task {
    const status = KanbanStatus.resolve(source.labels);

    return new Task(
      source.id,
      source.content,
      source.projectId,
      Priority.fromApiValue(source.priority),
      source.due
        ? TaskDue.of(source.due.date, source.due.datetime ?? null)
        : null,
      status,
      KanbanStatus.stripReserved(source.labels),
    );
  }
}
