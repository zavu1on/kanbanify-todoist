import type { KanbanStatusLevel } from "@/main/tasks";

/** Column order matches `KANBAN_STATUS_LEVELS` in the backend contract — left to
 * right, `none` first — which is also the tie-break order for status conflicts
 * (see `KanbanStatus` in the `tasks` module). */
export const KANBAN_COLUMN_LABELS: Record<KanbanStatusLevel, string> = {
  none: "No status",
  todo: "Todo",
  "in-progress": "In progress",
  completed: "Completed",
};

export const KANBAN_STATUS_COLORS: Record<
  Exclude<KanbanStatusLevel, "none">,
  string
> = {
  todo: "gray",
  "in-progress": "blue",
  completed: "green",
};
