import {
  KANBAN_STATUS_LEVELS,
  type KanbanStatusLevel,
  type PriorityLevel,
} from "@/main/tasks";

/** Matches the reference form's "Due" row (`docs/feat/filters/image.png`):
 * a single optional choice, not a multi-select like priority/labels. */
export const DUE_VARIANTS = [
  "today_overdue",
  "next_3_days",
  "next_7_days",
  "no_date",
] as const;

export type DueVariant = (typeof DUE_VARIANTS)[number];

/** `&` (AND) or `|` (OR) — the default — joining a field to the *next defined*
 * field in the query. */
export const FILTER_CONJUNCTIONS = ["and", "or"] as const;

export type FilterConjunction = (typeof FILTER_CONJUNCTIONS)[number];

/** Precedence of one AND/OR: `auto` (AND binds tighter than OR) or a rank
 * `1`–`4` — a higher rank binds first, equal ranks left to right, and any
 * rank outranks any `auto`. Strings, since they are form `Select` values. */
export const FILTER_PRECEDENCES = ["auto", "1", "2", "3", "4"] as const;

export type FilterPrecedence = (typeof FILTER_PRECEDENCES)[number];

/** Query order of the form's fields — Kanban status is always last. */
export const FILTER_FIELD_KEYS = [
  "project",
  "priorities",
  "due",
  "labels",
  "kanbanStatus",
] as const;

export type FilterFieldKey = (typeof FILTER_FIELD_KEYS)[number];

/** Kanban statuses a filter can target — the reserved labels, i.e. every
 * level but `none`. */
export const FILTER_KANBAN_STATUSES = KANBAN_STATUS_LEVELS.filter(
  (level) => level !== "none",
) as Exclude<KanbanStatusLevel, "none">[];

export type FilterKanbanStatus = (typeof FILTER_KANBAN_STATUSES)[number];

/** The structured shape `buildFilterQuery`/`parseFilterQuery` translate
 * to/from a Todoist filter query string. Keyed by project *name*, not id —
 * the query language references projects by name (`#ProjectName`), and
 * resolving a name back to an id (for the form's `Select`) is the form's
 * job, not this pure, IPC-free module's.
 *
 * `negated[key]` wraps that field's clause as `!(…)`; `next[key]` is the
 * conjunction after it and `prec[key]` that conjunction's precedence
 * (both meaningless for the last defined field, and absent for
 * `kanbanStatus`, which is always last). */
export type FilterQueryFields = {
  projectName: string | null;
  priorities: PriorityLevel[];
  due: DueVariant | null;
  labels: string[];
  kanbanStatus: FilterKanbanStatus | null;
  negated: Record<FilterFieldKey, boolean>;
  next: Record<Exclude<FilterFieldKey, "kanbanStatus">, FilterConjunction>;
  prec: Record<Exclude<FilterFieldKey, "kanbanStatus">, FilterPrecedence>;
};

export const createEmptyFilterFields = (): FilterQueryFields => ({
  projectName: null,
  priorities: [],
  due: null,
  labels: [],
  kanbanStatus: null,
  negated: {
    project: false,
    priorities: false,
    due: false,
    labels: false,
    kanbanStatus: false,
  },
  next: { project: "or", priorities: "or", due: "or", labels: "or" },
  prec: { project: "auto", priorities: "auto", due: "auto", labels: "auto" },
});
