import type { KanbanStatusLevel } from "../value-objects/KanbanStatus";
import type { PriorityLevel } from "../value-objects/Priority";

/** The IPC-serializable shape of a `Task` — see BACKEND_CODE_STYLE_GUIDE.md
 * "IPC-контракт и обработка ошибок": a domain entity never crosses IPC as-is,
 * only through its DTO. Nested value objects (`Priority`, `TaskDue`,
 * `KanbanStatus`) are flattened to plain data for the same reason. */
export type TaskDTO = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  priority: PriorityLevel;
  due: { date: string; datetime: string | null } | null;
  kanbanStatus: { level: KanbanStatusLevel; hasConflict: boolean };
  labels: string[];
  checked: boolean;
  parentId: string | null;
};
