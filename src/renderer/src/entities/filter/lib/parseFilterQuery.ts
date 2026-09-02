import { PRIORITY_LEVELS, type PriorityLevel } from "@/main/tasks";
import { DUE_TOKENS } from "./buildFilterQuery";
import type { FilterQueryFields } from "../model/filterFormFields";

const DUE_TOKEN_TO_VARIANT = new Map(
  Object.entries(DUE_TOKENS).map(([variant, token]) => [token, variant]),
) as Map<string, FilterQueryFields["due"]>;

const isPriorityLevel = (value: string): value is PriorityLevel =>
  (PRIORITY_LEVELS as readonly string[]).includes(value);

/** Un-parenthesizes a `(a | b | c)` group into its members, or returns a
 * single bare token as its own one-element list. */
const splitGroup = (segment: string): string[] => {
  const match = segment.match(/^\((.+)\)$/);
  return (match ? match[1] : segment).split(" | ");
};

/**
 * Reconstructs the filter form's structured fields from a query string —
 * the exact inverse of `buildFilterQuery`. This only has to undo strings
 * this app itself generated (the form never accepts raw query text), not
 * parse arbitrary Todoist filter syntax, so an
 * unrecognized segment is skipped rather than throwing — a hand-edited or
 * otherwise unexpected `query` value degrades to a blank-er form instead of
 * crashing the edit modal.
 */
export const parseFilterQuery = (query: string): FilterQueryFields => {
  const fields: FilterQueryFields = {
    projectName: null,
    priorities: [],
    due: null,
    labels: [],
  };

  const trimmed = query.trim();
  if (!trimmed) return fields;

  for (const segment of trimmed.split(" & ")) {
    if (segment.startsWith("#")) {
      fields.projectName = segment.slice(1);
      continue;
    }

    const dueVariant = DUE_TOKEN_TO_VARIANT.get(segment);
    if (dueVariant) {
      fields.due = dueVariant;
      continue;
    }

    if (segment.startsWith("@") || segment.startsWith("(@")) {
      fields.labels = splitGroup(segment).map((token) => token.slice(1));
      continue;
    }

    if (/^\(?p[1-4]/.test(segment)) {
      fields.priorities = splitGroup(segment).filter(isPriorityLevel);
    }
  }

  return fields;
};
