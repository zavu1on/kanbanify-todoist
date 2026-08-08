import { InvalidTaskTitleError } from "../errors/InvalidTaskTitleError";
import { TaskAlreadyCompletedError } from "../errors/TaskAlreadyCompletedError";
import {
  KanbanStatus,
  type KanbanStatusLevel,
  RESERVED_LABELS,
} from "../value-objects/KanbanStatus";
import { Priority, type PriorityLevel } from "../value-objects/Priority";
import { TaskDue } from "../value-objects/TaskDue";
import { TaskTitle } from "../value-objects/TaskTitle";

export type TaskDueDetails = { date: string; datetime: string | null };

export type TaskCreateDetails = {
  title: string;
  description: string;
  projectId: string;
  priority: PriorityLevel;
  due: TaskDueDetails | null;
  kanbanStatus: KanbanStatusLevel;
  /** Non-reserved labels only — the reserved kanban label is derived from
   * `kanbanStatus`, never passed in directly (see `KanbanStatus.applyTo`). */
  labels: string[];
};

export type TaskUpdateDetails = {
  title: string;
  description: string;
  priority: PriorityLevel;
  due: TaskDueDetails | null;
  labels: string[];
};

export type TaskReconstituteSource = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  priority: Priority;
  due: TaskDue | null;
  rawLabels: string[];
  checked: boolean;
};

export class Task {
  private _title: TaskTitle;
  private _description: string;
  private _projectId: string;
  private _priority: Priority;
  private _due: TaskDue | null;
  private _kanbanStatus: KanbanStatus;
  private _labels: string[];
  private _checked: boolean;

  private constructor(
    readonly id: string,
    title: TaskTitle,
    description: string,
    projectId: string,
    priority: Priority,
    due: TaskDue | null,
    kanbanStatus: KanbanStatus,
    /** Reserved kanban labels are stripped — see `Task.resolveStatus`. */
    labels: string[],
    checked: boolean,
  ) {
    this._title = title;
    this._description = description;
    this._projectId = projectId;
    this._priority = priority;
    this._due = due;
    this._kanbanStatus = kanbanStatus;
    this._labels = labels;
    this._checked = checked;
  }

  get title(): string {
    return this._title.value;
  }

  get description(): string {
    return this._description;
  }

  get projectId(): string {
    return this._projectId;
  }

  get priority(): Priority {
    return this._priority;
  }

  get due(): TaskDue | null {
    return this._due;
  }

  /** Resolved via `Task.resolveStatus` at construction time — never read
   * `labels` directly for status. */
  get kanbanStatus(): KanbanStatus {
    return this._kanbanStatus;
  }

  get labels(): string[] {
    return this._labels;
  }

  /** Whether this task is completed in Todoist itself — independent of
   * `kanbanStatus` (see SPECIFICATION.md "Доменная модель": a `completed`
   * kanban label does not imply this is true). */
  get checked(): boolean {
    return this._checked;
  }

  /** This task's full Todoist label list — its non-reserved labels plus the
   * current status's reserved label (dropped for "none"). Used to persist a
   * status change (see `UpdateTaskStatusUseCase`, `ITaskGateway.save`). */
  get rawLabels(): string[] {
    return this._kanbanStatus.applyTo(this._labels);
  }

  /** Factory for a task that doesn't exist in Todoist yet — `id` is empty
   * until `ITaskGateway.create` resolves with the real, API-assigned one
   * (see `CreateTaskUseCase`). Validates its title. */
  static create(details: TaskCreateDetails): Task {
    return new Task(
      "",
      Task.parseTitle(details.title),
      details.description.trim(),
      details.projectId,
      Priority.of(details.priority),
      details.due ? TaskDue.of(details.due.date, details.due.datetime) : null,
      KanbanStatus.of(details.kanbanStatus),
      KanbanStatus.stripReserved(details.labels),
      false,
    );
  }

  /** Rebuilds a task from already-trusted data (a mapped API response) — resolves
   * kanban status off the raw label list. */
  static reconstitute(source: TaskReconstituteSource): Task {
    return new Task(
      source.id,
      TaskTitle.of(source.title),
      source.description,
      source.projectId,
      source.priority,
      source.due,
      Task.resolveStatus(source.rawLabels),
      KanbanStatus.stripReserved(source.rawLabels),
      source.checked,
    );
  }

  /** Mutates this task's editable fields in place — `kanbanStatus` (`changeStatus`)
   * and `projectId` (`moveToProject`) are excluded on purpose: Todoist persists
   * them through separate endpoints (`updateTask({ labels })` vs `moveTask`), so
   * they're kept as distinct entity operations rather than folded in here. */
  update(details: TaskUpdateDetails): void {
    this._title = Task.parseTitle(details.title);
    this._description = details.description.trim();
    this._priority = Priority.of(details.priority);
    this._due = details.due
      ? TaskDue.of(details.due.date, details.due.datetime)
      : null;
    this._labels = KanbanStatus.stripReserved(details.labels);
  }

  /** Moves this task to a new kanban column — the reserved-label read-modify-write
   * itself happens via `rawLabels` (`KanbanStatus.applyTo`) when the caller persists
   * the change; this method only updates the in-memory status. */
  changeStatus(newLevel: KanbanStatusLevel): void {
    this._kanbanStatus = KanbanStatus.of(newLevel);
  }

  /** Changes this task's project — Todoist's `updateTask` has no `projectId`
   * field at all (only `moveTask` does), so this stays a separate operation
   * from `update` (see `ITaskGateway.move`). */
  moveToProject(projectId: string): void {
    this._projectId = projectId;
  }

  /** Marks this task done in Todoist itself — deliberately leaves `kanbanStatus`
   * untouched, since the two are independent axes (see `checked`) and this app
   * never syncs them automatically.
   * @throws {TaskAlreadyCompletedError} if the task is already checked. */
  complete(): void {
    if (this._checked) throw new TaskAlreadyCompletedError();
    this._checked = true;
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

  private static parseTitle(rawTitle: string): TaskTitle {
    const result = TaskTitle.safeParse(rawTitle);
    if (!result.success) throw new InvalidTaskTitleError(result.error);
    return result.data;
  }
}
