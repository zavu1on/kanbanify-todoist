import dayjs from "dayjs";
import { dropOverlaps } from "./dropOverlaps";
import { collectDateMatches } from "./parseQuickAddDue";
import { collectKanbanStatusMatches } from "./parseQuickAddKanbanStatus";
import { collectLabelMatches } from "./parseQuickAddLabel";
import { collectPriorityMatches } from "./parseQuickAddPriority";
import { collectProjectMatches } from "./parseQuickAddProject";
import type {
  QuickAddContext,
  QuickAddParseResult,
  QuickAddSegment,
  RawMatch,
} from "./types";

export const parseQuickAdd = (
  text: string,
  context: QuickAddContext,
  now: dayjs.Dayjs = dayjs(),
): QuickAddParseResult => {
  const matches = dropOverlaps([
    ...collectDateMatches(text, now),
    ...collectPriorityMatches(text),
    ...collectLabelMatches(text, context.reservedLabels),
    ...collectKanbanStatusMatches(text, context.reservedLabels),
    ...collectProjectMatches(text, context.projects),
  ]);

  const segments: QuickAddSegment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ text: text.slice(cursor, match.start), type: "plain" });
    }
    segments.push({
      text: text.slice(match.start, match.end),
      type: match.type,
    });
    cursor = match.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), type: "plain" });
  }

  const cleanTitle = segments
    .filter((segment) => segment.type === "plain")
    .map((segment) => segment.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  const lastOfType = <T extends RawMatch["type"]>(type: T) =>
    [...matches].reverse().find((match) => match.type === type);

  const dueMatch = lastOfType("due");
  const priorityMatch = lastOfType("priority");
  const projectMatch = lastOfType("project");
  const kanbanStatusMatch = lastOfType("kanbanStatus");
  const labels = [
    ...new Map(
      matches
        .filter((match) => match.type === "label" && match.label)
        .map((match) => [match.label?.toLowerCase(), match.label as string]),
    ).values(),
  ];

  return {
    cleanTitle,
    priority: priorityMatch?.priority ?? null,
    due: dueMatch?.due ?? null,
    projectId: projectMatch?.projectId ?? null,
    kanbanStatus: kanbanStatusMatch?.kanbanStatus ?? null,
    labels,
    segments,
  };
};
