import type { PriorityLevel } from "@/main/tasks";

/** Matches the reference form's "Due" row (`docs/feat/filters/image.png`):
 * a single optional choice, not a multi-select like priority/labels. */
export const DUE_VARIANTS = [
  "today_overdue",
  "today",
  "next_7_days",
  "no_date",
] as const;

export type DueVariant = (typeof DUE_VARIANTS)[number];

/** How `buildFilterQuery` joins the field blocks (project/priority/due/labels)
 * into the query string — `&` (AND, the default) or `|` (OR). A single
 * concatenator applies across all blocks, not per pair — Todoist's filter
 * language has no per-clause operator choice, so neither does this form. */
export const FILTER_CONJUNCTIONS = ["and", "or"] as const;

export type FilterConjunction = (typeof FILTER_CONJUNCTIONS)[number];

/** The structured shape `buildFilterQuery`/`parseFilterQuery` translate
 * to/from a Todoist filter query string. Keyed by project *name*, not id —
 * the query language references projects by name (`#ProjectName`), and
 * resolving a name back to an id (for the form's `Select`) is the form's
 * job, not this pure, IPC-free module's. */
export type FilterQueryFields = {
  projectName: string | null;
  priorities: PriorityLevel[];
  due: DueVariant | null;
  labels: string[];
  conjunction: FilterConjunction;
};
