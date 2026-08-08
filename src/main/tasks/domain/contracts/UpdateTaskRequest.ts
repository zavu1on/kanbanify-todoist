import type { KanbanStatusLevel } from "../value-objects/KanbanStatus";
import type { PriorityLevel } from "../value-objects/Priority";

/** The IPC-serializable input for `tasks:update` — shared by `preload` (typing
 * the invoke call) and the renderer (building the payload), so neither side
 * restates these fields on its own. */
export type UpdateTaskRequest = {
  title: string;
  description: string;
  projectId: string;
  priority: PriorityLevel;
  due: { date: string; datetime: string | null } | null;
  kanbanStatus: KanbanStatusLevel;
  labels: string[];
};
