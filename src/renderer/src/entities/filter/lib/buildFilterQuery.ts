import type { DueVariant, FilterQueryFields } from "../model/filterFormFields";

/** Due-variant tokens — `today_overdue` mirrors the backend's own
 * `TODAY_FILTER_QUERY` (`(today | overdue)`, see `ListTodayTasksUseCase`)
 * and `no_date` mirrors `ListTasksWithDueDateUseCase`'s `!no date` (base
 * token `no date`, negated there). `next_7_days` → `7 days` is Todoist's
 * documented filter-language token for "due within the next 7 days". */
export const DUE_TOKENS: Record<DueVariant, string> = {
  today_overdue: "(today | overdue)",
  today: "today",
  next_7_days: "7 days",
  no_date: "no date",
};

const CONJUNCTION_SEPARATORS: Record<FilterQueryFields["conjunction"], string> =
  {
    and: " & ",
    or: " | ",
  };

/**
 * Builds a Todoist filter query string from the filter form's structured
 * fields — fixed field order (project → priority → due → labels) joined by
 * `fields.conjunction` (` & ` for AND, the default, or ` | ` for OR) across
 * fields, multi-value fields always joined by ` | ` inside parens (OR within
 * a field, regardless of the cross-field conjunction — parens keep the two
 * levels unambiguous). Fields left empty/unset are omitted entirely, not
 * just left blank — `parseFilterQuery` relies on this exact, fixed format to
 * undo it (round-trip tested in `buildFilterQuery.spec.ts`), so keep both in
 * sync if this format ever changes.
 */
export const buildFilterQuery = (fields: FilterQueryFields): string => {
  const clauses: string[] = [];

  if (fields.projectName) clauses.push(`#${fields.projectName}`);

  if (fields.priorities.length === 1) {
    clauses.push(fields.priorities[0]);
  } else if (fields.priorities.length > 1) {
    clauses.push(`(${fields.priorities.join(" | ")})`);
  }

  if (fields.due) clauses.push(DUE_TOKENS[fields.due]);

  if (fields.labels.length === 1) {
    clauses.push(`@${fields.labels[0]}`);
  } else if (fields.labels.length > 1) {
    clauses.push(`(${fields.labels.map((label) => `@${label}`).join(" | ")})`);
  }

  return clauses.join(CONJUNCTION_SEPARATORS[fields.conjunction]);
};
