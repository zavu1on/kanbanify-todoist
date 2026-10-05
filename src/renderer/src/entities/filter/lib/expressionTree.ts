import type {
  FilterConjunction,
  FilterFieldKey,
  FilterPrecedence,
  FilterQueryFields,
} from "../model/filterFormFields";

/** Leaves are positions in the list of defined fields, not field keys. */
export type TreeNode =
  | { kind: "leaf"; index: number }
  | { kind: "op"; op: FilterConjunction; children: TreeNode[] };

export type OperatorSpec = { conj: FilterConjunction; prec: FilterPrecedence };

// A number outranks every `auto`; among `auto`, AND binds tighter than OR.
const rank = ({ conj, prec }: OperatorSpec): number =>
  prec === "auto" ? (conj === "and" ? 0.5 : 0) : Number(prec);

/** Joins `nodes` under `op`, hoisting same-operator children so `a & b & c`
 * stays one flat node whichever way it was grouped. */
export const joinNodes = (
  op: FilterConjunction,
  nodes: TreeNode[],
): TreeNode | null => {
  if (nodes.length === 0) return null;
  if (nodes.length === 1) return nodes[0];
  return {
    kind: "op",
    op,
    children: nodes.flatMap((node) =>
      node.kind === "op" && node.op === op ? node.children : [node],
    ),
  };
};

/**
 * Precedence climbing over `count` leaves and the `count - 1` operators
 * between them: a higher-ranked operator binds first, equal ranks left to
 * right.
 */
export const buildTree = (count: number, ops: OperatorSpec[]): TreeNode => {
  let position = 0;
  const parse = (minRank: number): TreeNode => {
    let left: TreeNode = { kind: "leaf", index: position++ };
    while (position - 1 < ops.length && rank(ops[position - 1]) >= minRank) {
      const op = ops[position - 1];
      const right = parse(rank(op) + 0.25);
      left = joinNodes(op.conj, [left, right]) as TreeNode;
    }
    return left;
  };
  return count === 0 ? { kind: "op", op: "or", children: [] } : parse(-1);
};

export const evaluateTree = (
  node: TreeNode,
  leafValue: (index: number) => boolean,
): boolean => {
  if (node.kind === "leaf") return leafValue(node.index);
  const results = node.children.map((child) => evaluateTree(child, leafValue));
  return node.op === "and" ? results.every(Boolean) : results.some(Boolean);
};

/** Canonical string of the tree's structure, for comparing two trees. */
export const shapeOf = (node: TreeNode): string =>
  node.kind === "leaf"
    ? String(node.index)
    : `${node.op}(${node.children.map(shapeOf).join(",")})`;

const isDefined = (fields: FilterQueryFields, key: FilterFieldKey): boolean => {
  switch (key) {
    case "project":
      return !!fields.projectName;
    case "priorities":
      return fields.priorities.length > 0;
    case "due":
      return fields.due !== null;
    case "labels":
      return fields.labels.length > 0;
    case "kanbanStatus":
      return fields.kanbanStatus !== null;
  }
};

const FIELD_ORDER: FilterFieldKey[] = [
  "project",
  "priorities",
  "due",
  "labels",
  "kanbanStatus",
];

/**
 * The expression a filter's form fields describe: defined fields in query
 * order are the leaves; the operator after each (except the last defined)
 * is that field's `next`/`prec`, so an empty field defines no operator.
 * `keys[i]` is the field behind leaf `i`.
 */
export const buildFilterTree = (
  fields: FilterQueryFields,
): { tree: TreeNode; keys: FilterFieldKey[] } => {
  const keys = FIELD_ORDER.filter((key) => isDefined(fields, key));
  const ops = keys.slice(0, -1).map((key) => ({
    conj: fields.next[key as keyof FilterQueryFields["next"]],
    prec: fields.prec[key as keyof FilterQueryFields["prec"]],
  }));
  return { tree: buildTree(keys.length, ops), keys };
};
