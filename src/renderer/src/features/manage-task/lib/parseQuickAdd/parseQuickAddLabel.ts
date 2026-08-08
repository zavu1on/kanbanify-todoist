import type { RawMatch } from "./types";

// `\p{L}`/`\p{N}` (Unicode letter/number categories) instead of `a-zA-Z0-9` so
// non-Latin label names (e.g. Cyrillic) are recognized too — Todoist labels
// aren't restricted to ASCII. Also used by `parseQuickAddKanbanStatus` — the
// reserved kanban labels share this exact `@name` token syntax.
export const LABEL_RE = /@([\p{L}\p{N}_-]+)/gu;

export const collectLabelMatches = (
  text: string,
  reservedLabels: readonly string[],
): RawMatch[] =>
  [...text.matchAll(LABEL_RE)]
    .filter((match) => !reservedLabels.includes(match[1]?.toLowerCase() ?? ""))
    .map((match) => {
      const start = match.index ?? 0;
      return {
        start,
        end: start + match[0].length,
        type: "label" as const,
        label: match[1],
      };
    });

export const buildLabelToken = (label: string) => `@${label}`;
