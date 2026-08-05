import type { UniqueIdentifier } from "@dnd-kit/core";
import { KANBAN_STATUS_LEVELS, type KanbanStatusLevel } from "@/main/tasks";
import type { ColumnsByStatus } from "./buildColumns";

// A drop target is either a column itself (empty area, id = status) or one of
// its sortable cards (id = task id) — this resolves either to the column it
// belongs to.
export const findContainer = (
  id: UniqueIdentifier,
  columns: ColumnsByStatus,
): KanbanStatusLevel | undefined => {
  if (KANBAN_STATUS_LEVELS.includes(id as KanbanStatusLevel)) {
    return id as KanbanStatusLevel;
  }
  for (const [status, tasks] of columns) {
    if (tasks.some((task) => task.id === id)) return status;
  }
  return undefined;
};
