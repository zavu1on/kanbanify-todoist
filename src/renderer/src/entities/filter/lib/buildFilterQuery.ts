import { buildFilterTree, type TreeNode } from "./expressionTree";
import type { DueVariant, FilterQueryFields } from "../model/filterFormFields";

/** Due-variant tokens — `today_overdue` mirrors the backend's own
 * `TODAY_FILTER_QUERY` (`(today | overdue)`, see `ListTodayTasksUseCase`)
 * and `no_date` mirrors `ListTasksWithDueDateUseCase`'s `!no date` (base
 * token `no date`, negated there). `next_7_days` → `7 days` is Todoist's
 * documented filter-language token for "due within the next 7 days".
 * Stored un-parenthesized — `clause` adds the parens a multi-token body
 * needs. */
export const DUE_TOKENS: Record<DueVariant, string> = {
  today_overdue: "today | overdue",
  today: "today",
  next_7_days: "7 days",
  no_date: "no date",
};

const SEPARATORS = { and: " & ", or: " | " } as const;

/** `!(body)` when negated (parens always — `!` must sit right before them),
 * otherwise `(body)` only for an OR-group, bare otherwise. */
const clause = (body: string, negated: boolean): string => {
  if (negated) return `!(${body})`;
  return body.includes(" | ") ? `(${body})` : body;
};

const printTree = (node: TreeNode, leaves: string[]): string => {
  if (node.kind === "leaf") return leaves[node.index];
  // Nested op nodes always differ from their parent's operator (same-operator
  // ones are flattened), so every one of them needs parens.
  return node.children
    .map((child) =>
      child.kind === "op"
        ? `(${printTree(child, leaves)})`
        : printTree(child, leaves),
    )
    .join(SEPARATORS[node.op]);
};

/**
 * Builds a Todoist filter query string from the filter form's structured
 * fields — fixed field order (project → priority → due → labels → kanban
 * status). Each defined field becomes one clause (multi-value fields are an
 * OR-group inside), optionally negated. Clauses are combined per the
 * operator after each defined field (`next` + `prec`, see
 * `buildFilterTree`); whenever `&` and `|` mix, the grouping is written as
 * explicit parens, so the result never depends on Todoist's own (officially
 * undocumented) `&`/`|` precedence. A query without mixed operators has no
 * extra parens. `parseFilterQuery` undoes this exact format (round-trip
 * tested in `buildFilterQuery.spec.ts`), so keep both in sync.
 */
export const buildFilterQuery = (fields: FilterQueryFields): string => {
  const { tree, keys } = buildFilterTree(fields);
  if (keys.length === 0) return "";

  const bodies: Record<(typeof keys)[number], string> = {
    project: `#${fields.projectName}`,
    priorities: fields.priorities.join(" | "),
    due: fields.due ? DUE_TOKENS[fields.due] : "",
    labels: fields.labels.map((label) => `@${label}`).join(" | "),
    kanbanStatus: `@${fields.kanbanStatus}`,
  };
  const leaves = keys.map((key) => clause(bodies[key], fields.negated[key]));
  return printTree(tree, leaves);
};
