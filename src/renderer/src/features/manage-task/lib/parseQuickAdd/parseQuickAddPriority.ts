import type { PriorityLevel } from "@/main/tasks";
import type { RawMatch } from "./types";

const PRIORITY_RE = /\bp([1-4])\b/gi;

export const collectPriorityMatches = (text: string): RawMatch[] =>
  [...text.matchAll(PRIORITY_RE)].map((match) => {
    const start = match.index ?? 0;
    return {
      start,
      end: start + match[0].length,
      type: "priority" as const,
      priority: `p${match[1]}` as PriorityLevel,
    };
  });

/** Builds the canonical token text for a manually-changed priority, so
 * `resyncTitleToken` can insert/replace it in the title (SPECIFICATION.md's
 * requirement: a manual field edit updates the corresponding keyword in the
 * input). */
export const buildPriorityToken = (priority: PriorityLevel) => priority;
