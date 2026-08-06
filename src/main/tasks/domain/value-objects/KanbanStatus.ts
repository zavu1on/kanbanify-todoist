export const KANBAN_STATUS_LEVELS = [
  "none",
  "todo",
  "in-progress",
  "completed",
] as const;
export type KanbanStatusLevel = (typeof KANBAN_STATUS_LEVELS)[number];

/**
 * Reserved Todoist label names that carry kanban status, ordered left-to-right
 * exactly as the kanban columns appear (see SPECIFICATION.md "Kanban-статус").
 * The order here IS the tie-break rule used by `Task.resolveStatus`: the
 * rightmost entry present on a task wins, so keep this array in column
 * order, not any other.
 */
export const RESERVED_LABELS = [
  "todo",
  "in-progress",
  "completed",
] as const satisfies readonly Exclude<KanbanStatusLevel, "none">[];

/**
 * Kanban status isn't a native Todoist field (community-tier API has none) — it's
 * encoded as a reserved label on the task. This is the single place that reads or
 * writes that encoding; nothing else should touch reserved label names directly.
 * Conflict resolution across a task's labels is `Task`'s job (see
 * `Task.resolveStatus`), not this VO's — this class only represents the value.
 */
export class KanbanStatus {
  private constructor(
    readonly level: KanbanStatusLevel,
    /** True when the task carried more than one reserved label; the UI shows a warning icon. */
    readonly hasConflict: boolean,
  ) {}

  static of(level: KanbanStatusLevel, hasConflict = false): KanbanStatus {
    return new KanbanStatus(level, hasConflict);
  }

  /** Labels with every reserved kanban label removed — status is surfaced separately. */
  static stripReserved(labels: string[]): string[] {
    return labels.filter(
      (label) => !(RESERVED_LABELS as readonly string[]).includes(label),
    );
  }

  static isKanbanStatusLevel(value: unknown): value is KanbanStatusLevel {
    return (
      typeof value === "string" &&
      (KANBAN_STATUS_LEVELS as readonly string[]).includes(value)
    );
  }

  /** Drops any existing reserved label and adds this status's (none = drop only). */
  applyTo(labels: string[]): string[] {
    const withoutReserved = KanbanStatus.stripReserved(labels);
    return this.level === "none"
      ? withoutReserved
      : [...withoutReserved, this.level];
  }
}
