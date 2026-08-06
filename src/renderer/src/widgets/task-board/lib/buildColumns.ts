import {
  KANBAN_STATUS_LEVELS,
  type KanbanStatusLevel,
  type TaskDTO,
} from "@/main/tasks";

export type ColumnsByStatus = Map<KanbanStatusLevel, TaskDTO[]>;

/**
 * Groups tasks by kanban status. Without `previous`, column order just
 * follows `tasks` order (used for the initial build).
 *
 * With `previous`, existing card order is preserved for every task whose
 * column hasn't changed — only genuinely new tasks (freshly fetched, or a
 * task that just moved column) fall back to `tasks` order. This is what
 * keeps a dropped card at the spot the user dropped it on instead of
 * snapping to wherever `tasks` order (e.g. sorted by due date) would place
 * it — see SPECIFICATION.md "Kanban-режим": drag inside a column sets
 * *manual* order, which a naive rebuild-from-`tasks` on every render would
 * silently discard.
 */
export const buildColumns = (
  tasks: TaskDTO[],
  previous?: ColumnsByStatus,
): ColumnsByStatus => {
  const columns = new Map<KanbanStatusLevel, TaskDTO[]>(
    KANBAN_STATUS_LEVELS.map((status) => [status, []]),
  );

  if (!previous) {
    for (const task of tasks) {
      columns.get(task.kanbanStatus.level)?.push(task);
    }
    return columns;
  }

  const byId = new Map(tasks.map((task) => [task.id, task]));
  const placed = new Set<string>();

  for (const [status, prevTasks] of previous) {
    for (const prevTask of prevTasks) {
      const task = byId.get(prevTask.id);
      if (task && task.kanbanStatus.level === status) {
        columns.get(status)?.push(task);
        placed.add(task.id);
      }
    }
  }

  for (const task of tasks) {
    if (!placed.has(task.id)) {
      columns.get(task.kanbanStatus.level)?.push(task);
      placed.add(task.id);
    }
  }

  return columns;
};
