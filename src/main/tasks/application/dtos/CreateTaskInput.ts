import type { KanbanStatusLevel } from "../../domain/value-objects/KanbanStatus";
import type { PriorityLevel } from "../../domain/value-objects/Priority";

export class CreateTaskInput {
  constructor(
    readonly title: string,
    readonly description: string,
    readonly projectId: string,
    readonly priority: PriorityLevel,
    readonly due: { date: string; datetime: string | null } | null,
    readonly kanbanStatus: KanbanStatusLevel,
    readonly labels: string[],
    readonly parentId: string | null,
  ) {}
}
