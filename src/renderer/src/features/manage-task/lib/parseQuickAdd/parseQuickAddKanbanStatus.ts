import type { KanbanStatusLevel } from "@/main/tasks";
import { LABEL_RE } from "./parseQuickAddLabel";
import type { RawMatch } from "./types";

/** `@todo` / `@in-progress` / `@completed` set the Kanban status directly
 * rather than becoming a regular label (SPECIFICATION.md "Kanban-статус":
 * reserved labels are never settable as plain labels). */
export const collectKanbanStatusMatches = (
  text: string,
  reservedLabels: readonly string[],
): RawMatch[] =>
  [...text.matchAll(LABEL_RE)]
    .filter((match) => reservedLabels.includes(match[1]?.toLowerCase() ?? ""))
    .map((match) => {
      const start = match.index ?? 0;
      return {
        start,
        end: start + match[0].length,
        type: "kanbanStatus" as const,
        kanbanStatus: match[1]?.toLowerCase() as KanbanStatusLevel,
      };
    });

/** Reserved labels double as the Kanban status token — same `@name` shape as
 * a regular label, just restricted to the three reserved names. */
export const buildKanbanStatusToken = (
  status: Exclude<KanbanStatusLevel, "none">,
) => `@${status}`;
