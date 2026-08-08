import type { KanbanStatusLevel, PriorityLevel } from "@/main/tasks";

export type QuickAddSegmentType =
  | "plain"
  | "priority"
  | "due"
  | "label"
  | "project"
  | "kanbanStatus";

export type QuickAddSegment = {
  text: string;
  type: QuickAddSegmentType;
};

export type QuickAddContext = {
  projects: { id: string; name: string }[];
  /** Reserved kanban labels (`todo`/`in-progress`/`completed`) — never settable
   * through an `@label` token, same restriction as the Labels field itself
   * (see SPECIFICATION.md "Детальное отображение задачи"). */
  reservedLabels: readonly string[];
};

export type QuickAddParseResult = {
  /** The title with every recognized token stripped — what actually gets
   * submitted as the task's title (SPECIFICATION.md "Добавление задачи":
   * "из названия при сохранении они вырезаются"). */
  cleanTitle: string;
  priority: PriorityLevel | null;
  due: { date: string; datetime: string | null } | null;
  projectId: string | null;
  kanbanStatus: KanbanStatusLevel | null;
  labels: string[];
  /** The raw text split into highlightable spans, in original order/casing —
   * used to render the input's inline highlighting. */
  segments: QuickAddSegment[];
};

/** A single attribute's regex match, before overlap resolution — one
 * `collect*Matches` per attribute file produces these, `dropOverlaps` and
 * `parseQuickAdd` consume them uniformly regardless of which attribute they
 * came from. */
export type RawMatch = {
  start: number;
  end: number;
  type: QuickAddSegmentType;
  priority?: PriorityLevel;
  due?: { date: string; datetime: string | null };
  label?: string;
  projectId?: string;
  kanbanStatus?: KanbanStatusLevel;
};
