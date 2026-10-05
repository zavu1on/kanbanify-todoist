import { PRIORITY_LEVELS, type PriorityLevel } from "@/main/tasks";
import { DUE_TOKENS } from "./buildFilterQuery";
import {
  buildTree,
  joinNodes,
  shapeOf,
  type OperatorSpec,
  type TreeNode,
} from "./expressionTree";
import {
  createEmptyFilterFields,
  FILTER_KANBAN_STATUSES,
  type FilterConjunction,
  type FilterFieldKey,
  type FilterKanbanStatus,
  type FilterPrecedence,
  type FilterQueryFields,
} from "../model/filterFormFields";

const DUE_TOKEN_TO_VARIANT = new Map(
  Object.entries(DUE_TOKENS).map(([variant, token]) => [token, variant]),
) as Map<string, FilterQueryFields["due"]>;

const isPriorityLevel = (value: string): value is PriorityLevel =>
  (PRIORITY_LEVELS as readonly string[]).includes(value);

const isKanbanStatus = (value: string): value is FilterKanbanStatus =>
  (FILTER_KANBAN_STATUSES as readonly string[]).includes(value);

/** Splits `str` on `separator`, but only where it sits outside any
 * parenthesized group — so a field's own OR-group (`(p1 | p2)`) never gets
 * mistaken for an operator between fields. */
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

/** Whether `body` is one field's own clause (as `buildFilterQuery` writes
 * it between parens) rather than an expression combining several fields. */
const isFieldBody = (body: string): boolean => {
  if (/^p[1-4]( \| p[1-4])*$/.test(body)) return true;
  if (DUE_TOKEN_TO_VARIANT.has(body)) return true;
  return body
    .split(" | ")
    .every(
      (token) =>
        /^@[^\s&|()!]+$/.test(token) && !isKanbanStatus(token.slice(1)),
    );
};

/**
 * Reconstructs the filter form's structured fields from a query string —
 * the exact inverse of `buildFilterQuery`. This only has to undo strings
 * this app itself generated (the form never accepts raw query text), plus
 * older flat ones (`a | b & c`, read with `&` binding tighter), not parse
 * arbitrary Todoist filter syntax, so an unrecognized segment is skipped
 * rather than throwing — a hand-edited or otherwise unexpected `query`
 * value degrades to a blank-er form instead of crashing the edit modal.
 *
 * The query is parsed into an expression tree (` | ` splits first, then
 * ` & `, parens recurse). The operator between two neighbouring fields is
 * their lowest common ancestor's: that gives `next`, and — unless the whole
 * tree equals what all-`auto` would build — a numeric `prec` (deeper =
 * higher). A lone `@todo`/`@in-progress`/`@completed` is always the Kanban
 * status (the form forbids them as labels).
 */
export const parseFilterQuery = (query: string): FilterQueryFields => {
  const fields = createEmptyFilterFields();
  const trimmed = query.trim();
  if (!trimmed) return fields;

  const leafKeys: FilterFieldKey[] = [];

  /** Applies one field's clause to `fields`; returns its leaf, or `null` if
   * unrecognized or the field was already set. */
  const parseLeaf = (body: string, negated: boolean): TreeNode | null => {
    let key: FilterFieldKey | null = null;
    if (body.startsWith("#")) {
      key = "project";
    } else if (DUE_TOKEN_TO_VARIANT.has(body)) {
      key = "due";
    } else if (body.startsWith("@")) {
      const tokens = body.split(" | ").map((token) => token.slice(1));
      key =
        tokens.length === 1 && isKanbanStatus(tokens[0])
          ? "kanbanStatus"
          : "labels";
    } else if (/^p[1-4]/.test(body)) {
      key = "priorities";
    }
    if (!key || leafKeys.includes(key)) return null;

    if (key === "project") fields.projectName = body.slice(1);
    else if (key === "due") fields.due = DUE_TOKEN_TO_VARIANT.get(body) ?? null;
    else if (key === "kanbanStatus")
      fields.kanbanStatus = body.slice(1) as FilterKanbanStatus;
    else if (key === "labels")
      fields.labels = body.split(" | ").map((token) => token.slice(1));
    else fields.priorities = body.split(" | ").filter(isPriorityLevel);

    fields.negated[key] = negated;
    leafKeys.push(key);
    return { kind: "leaf", index: leafKeys.length - 1 };
  };

  const parseAtom = (raw: string): TreeNode | null => {
    const segment = raw.trim();
    const negated = segment.match(/^!\((.*)\)$/);
    if (negated) return parseLeaf(negated[1], true);
    const grouped = segment.match(/^\((.*)\)$/);
    if (grouped) {
      return isFieldBody(grouped[1])
        ? parseLeaf(grouped[1], false)
        : parseExpr(grouped[1]);
    }
    return parseLeaf(segment, false);
  };

  const parseAnd = (str: string): TreeNode | null =>
    joinNodes(
      "and",
      splitTopLevel(str, " & ")
        .map(parseAtom)
        .filter((node): node is TreeNode => node !== null),
    );

  function parseExpr(str: string): TreeNode | null {
    return joinNodes(
      "or",
      splitTopLevel(str, " | ")
        .map(parseAnd)
        .filter((node): node is TreeNode => node !== null),
    );
  }

  const tree = parseExpr(trimmed);
  if (!tree) return fields;

  // The operator between leaf k and k+1 belongs to their lowest common
  // ancestor: record its conjunction and depth at boundary k.
  const boundaries: { op: FilterConjunction; depth: number }[] = [];
  const walk = (node: TreeNode, depth: number): { last: number } => {
    if (node.kind === "leaf") return { last: node.index };
    let previousLast = -1;
    node.children.forEach((child, i) => {
      const { last } = walk(child, depth + 1);
      if (i > 0) boundaries[previousLast] = { op: node.op, depth };
      previousLast = last;
    });
    return { last: previousLast };
  };
  walk(tree, 0);

  const count = leafKeys.length;
  const autoOps: OperatorSpec[] = Array.from({ length: count - 1 }, (_, k) => ({
    conj: boundaries[k]?.op ?? "or",
    prec: "auto",
  }));
  const isAuto = shapeOf(buildTree(count, autoOps)) === shapeOf(tree);

  leafKeys.forEach((key, k) => {
    const boundary = boundaries[k];
    if (!boundary || key === "kanbanStatus") return;
    fields.next[key] = boundary.op;
    if (!isAuto) {
      fields.prec[key] = String(boundary.depth + 1) as FilterPrecedence;
    }
  });

  return fields;
};
