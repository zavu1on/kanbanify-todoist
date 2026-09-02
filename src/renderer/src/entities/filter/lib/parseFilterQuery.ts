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

/** Splits `str` on `separator`, but only where it sits outside any
 * parenthesized group — so a field's own OR-group (`(p1 | p2)`) never gets
 * mistaken for the cross-field conjunction. */
const splitTopLevel = (str: string, separator: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "(") depth++;
    else if (char === ")") depth--;

    if (depth === 0 && str.startsWith(separator, i)) {
      parts.push(current);
      current = "";
      i += separator.length - 1;
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
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
    conjunction: "and",
  };

  const trimmed = query.trim();
  if (!trimmed) return fields;

  // Which separator actually joins the top-level blocks decides the
  // conjunction — try AND first (the default), fall back to OR only if no
  // top-level ` & ` was found. A single block (no top-level separator
  // either way) stays "and", matching the form's default.
  let segments = splitTopLevel(trimmed, " & ");
  if (segments.length === 1) {
    const orSegments = splitTopLevel(trimmed, " | ");
    if (orSegments.length > 1) {
      segments = orSegments;
      fields.conjunction = "or";
    }
  }

  for (const segment of segments) {
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
