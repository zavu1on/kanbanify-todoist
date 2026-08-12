import { KANBAN_STATUS_LEVELS } from "@/main/tasks";

/** Reserved kanban labels (see `KANBAN_STATUS_LEVELS`) never go through the
 * Labels field or an `@label` quick-add token — they're only ever set via
 * the Kanban status control (SPECIFICATION.md "Детальное отображение задачи"). */
export const RESERVED_LABELS = KANBAN_STATUS_LEVELS.filter(
  (level): level is Exclude<typeof level, "none"> => level !== "none",
);
