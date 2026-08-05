import type { KanbanStatus } from "../value-objects/KanbanStatus";
import type { Priority } from "../value-objects/Priority";
import type { TaskDue } from "../value-objects/TaskDue";

export class Task {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly projectId: string,
    readonly priority: Priority,
    readonly due: TaskDue | null,
    /** Resolved via `KanbanStatus.resolve` — never read `labels` directly for status. */
    readonly kanbanStatus: KanbanStatus,
    /** Reserved kanban labels are stripped — see `KanbanStatus.stripReserved`. */
    readonly labels: string[],
  ) {}
}
