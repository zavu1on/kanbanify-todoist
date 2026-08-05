import type { KanbanStatusLevel } from "../../domain/value-objects/KanbanStatus";

export class UpdateTaskStatusInput {
  constructor(
    readonly taskId: string,
    readonly status: KanbanStatusLevel,
  ) {}
}
