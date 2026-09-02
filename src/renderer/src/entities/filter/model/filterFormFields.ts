import type { PriorityLevel } from "@/main/tasks";

/** Matches the reference form's "Due" row (`docs/feat/filters/image.png`):
 * a single optional choice, not a multi-select like priority/labels. */
export const DUE_VARIANTS = [
  "today_overdue",
  "today",
  "overdue",
  "next_7_days",
  "no_date",
] as const;

export type DueVariant = (typeof DUE_VARIANTS)[number];

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
};
