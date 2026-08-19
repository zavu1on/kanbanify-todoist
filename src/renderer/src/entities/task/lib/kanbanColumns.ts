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

export const KANBAN_STATUS_COLORS: Record<KanbanStatusLevel, string> = {
  none: "#b6bcc7",
  todo: "#7b8494",
  "in-progress": "#2f6fb3",
  completed: "#2f9e5f",
};
