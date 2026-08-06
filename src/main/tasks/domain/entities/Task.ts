import {
  KanbanStatus,
  type KanbanStatusLevel,
  RESERVED_LABELS,
} from "../value-objects/KanbanStatus";
import type { Priority } from "../value-objects/Priority";
import type { TaskDue } from "../value-objects/TaskDue";

export type TaskReconstituteSource = {
  id: string;
  title: string;
  projectId: string;
  priority: Priority;
  due: TaskDue | null;
  rawLabels: string[];
};

export class Task {
  private _kanbanStatus: KanbanStatus;

  private constructor(
    readonly id: string,
    readonly title: string,
    readonly projectId: string,
    readonly priority: Priority,
    readonly due: TaskDue | null,
    kanbanStatus: KanbanStatus,
    /** Reserved kanban labels are stripped — see `Task.resolveStatus`. */
    readonly labels: string[],
  ) {
    this._kanbanStatus = kanbanStatus;
  }

  /** Resolved via `Task.resolveStatus` at construction time — never read
   * `labels` directly for status. */
  get kanbanStatus(): KanbanStatus {
    return this._kanbanStatus;
  }

  /** This task's full Todoist label list — its non-reserved labels plus the
   * current status's reserved label (dropped for "none"). Used to persist a
   * status change (see `UpdateTaskStatusUseCase`, `ITaskGateway.save`). */
  get rawLabels(): string[] {
    return this._kanbanStatus.applyTo(this.labels);
  }

  /** Rebuilds a task from already-trusted data (a mapped API response) — resolves
   * kanban status off the raw label list, since a task never comes from anywhere
   * but Todoist (there's no user-facing "create task" flow yet, see DEFERRED.md). */
  static reconstitute(source: TaskReconstituteSource): Task {
    return new Task(
      source.id,
      source.title,
      source.projectId,
      source.priority,
      source.due,
      Task.resolveStatus(source.rawLabels),
      KanbanStatus.stripReserved(source.rawLabels),
    );
  }

  /** Moves this task to a new kanban column — the reserved-label read-modify-write
   * itself happens via `rawLabels` (`KanbanStatus.applyTo`) when the caller persists
   * the change; this method only updates the in-memory status. */
  changeStatus(newLevel: KanbanStatusLevel): void {
    this._kanbanStatus = KanbanStatus.of(newLevel);
  }

  /**
   * A task can end up with more than one reserved label if labels were edited
   * outside this app. When that happens the rightmost column wins — `completed`
   * beats `in-progress` beats `todo` (see `RESERVED_LABELS` order).
   */
  private static resolveStatus(rawLabels: string[]): KanbanStatus {
    const present = RESERVED_LABELS.filter((reserved) =>
      rawLabels.includes(reserved),
    );
    if (present.length === 0) return KanbanStatus.of("none");

    return KanbanStatus.of(present[present.length - 1], present.length > 1);
  }
}
