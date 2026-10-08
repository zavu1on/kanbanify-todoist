import { describe, expect, it } from "vitest";
import {
  createEmptyFilterFields,
  type FilterQueryFields,
} from "../model/filterFormFields";
import { buildFilterQuery } from "./buildFilterQuery";
import { parseFilterQuery } from "./parseFilterQuery";

const fields = (overrides: Partial<FilterQueryFields>): FilterQueryFields => ({
  ...createEmptyFilterFields(),
  ...overrides,
});

describe("buildFilterQuery", () => {
  it("returns an empty string for empty fields", () => {
    expect(buildFilterQuery(createEmptyFilterFields())).toBe("");
  });

  it("builds single and grouped clauses", () => {
    expect(buildFilterQuery(fields({ projectName: "Work" }))).toBe("#Work");
    expect(buildFilterQuery(fields({ priorities: ["p1", "p2"] }))).toBe(
      "(p1 | p2)",
    );
    expect(buildFilterQuery(fields({ due: "today_overdue" }))).toBe(
      "(today | overdue)",
    );
    expect(buildFilterQuery(fields({ due: "next_3_days" }))).toBe("3 days");
    expect(buildFilterQuery(fields({ due: "next_7_days" }))).toBe("7 days");
  });

  it("negates with ! right before parens", () => {
    expect(
      buildFilterQuery(
        fields({
          labels: ["today"],
          negated: { ...createEmptyFilterFields().negated, labels: true },
        }),
      ),
    ).toBe("!(@today)");
    expect(
      buildFilterQuery(
        fields({
          priorities: ["p1", "p2"],
          negated: { ...createEmptyFilterFields().negated, priorities: true },
        }),
      ),
    ).toBe("!(p1 | p2)");
    expect(
      buildFilterQuery(
        fields({
          due: "today_overdue",
          negated: { ...createEmptyFilterFields().negated, due: true },
        }),
      ),
    ).toBe("!(today | overdue)");
  });

  it("joins by each field's own conjunction, OR by default", () => {
    expect(
      buildFilterQuery(fields({ due: "next_3_days", labels: ["a"] })),
    ).toBe("3 days | @a");
    expect(
      buildFilterQuery(
        fields({
          due: "next_3_days",
          labels: ["a"],
          next: { ...createEmptyFilterFields().next, due: "and" },
        }),
      ),
    ).toBe("3 days & @a");
  });

  it("skips empty fields and uses the previous defined field's conjunction", () => {
    expect(
      buildFilterQuery(
        fields({
          projectName: "Work",
          labels: ["a"],
          next: { ...createEmptyFilterFields().next, project: "and" },
        }),
      ),
    ).toBe("#Work & @a");
  });

  it("puts Kanban status last and ignores the last conjunction", () => {
    expect(
      buildFilterQuery(
        fields({
          labels: ["a"],
          kanbanStatus: "todo",
          next: { ...createEmptyFilterFields().next, labels: "and" },
        }),
      ),
    ).toBe("@a & @todo");
    expect(
      buildFilterQuery(
        fields({
          due: "next_3_days",
          next: { ...createEmptyFilterFields().next, due: "and" },
        }),
      ),
    ).toBe("3 days");
  });
});

describe("parseFilterQuery", () => {
  it("returns empty fields for an empty query", () => {
    expect(parseFilterQuery("  ")).toEqual(createEmptyFilterFields());
  });

  it("does not throw on an unrecognized query", () => {
    expect(() => parseFilterQuery("???")).not.toThrow();
  });

  it("always reads a lone reserved label as the Kanban status", () => {
    expect(parseFilterQuery("@todo | p1").kanbanStatus).toBe("todo");
    expect(parseFilterQuery("p1 | @todo").labels).toEqual([]);
  });

  const empty = createEmptyFilterFields();
  const cases: [string, FilterQueryFields][] = [
    ["project", fields({ projectName: "Work" })],
    [
      "all fields, defaults",
      fields({
        projectName: "Work",
        priorities: ["p1", "p3"],
        due: "no_date",
        labels: ["a", "b"],
        kanbanStatus: "in-progress",
      }),
    ],
    [
      "mixed conjunctions",
      fields({
        projectName: "Work",
        priorities: ["p1"],
        due: "next_3_days",
        labels: ["a"],
        kanbanStatus: "completed",
        next: { project: "and", priorities: "or", due: "and", labels: "or" },
      }),
    ],
    [
      "negations",
      fields({
        priorities: ["p1", "p2"],
        due: "today_overdue",
        labels: ["today"],
        kanbanStatus: "todo",
        negated: {
          ...empty.negated,
          priorities: true,
          due: true,
          labels: true,
          kanbanStatus: true,
        },
        next: { ...empty.next, priorities: "and" },
      }),
    ],
    [
      "skipped middle field",
      fields({
        projectName: "Work",
        labels: ["a"],
        next: { ...empty.next, project: "and" },
      }),
    ],
  ];

  it.each(cases)("round-trips %s", (_name, input) => {
    const parsed = parseFilterQuery(buildFilterQuery(input));
    // Conjunction of the last defined field and of empty fields isn't encoded.
    expect(buildFilterQuery(parsed)).toBe(buildFilterQuery(input));
    expect(parsed.negated).toEqual(input.negated);
    expect({ ...parsed, negated: 0, next: 0 }).toEqual({
      ...input,
      negated: 0,
      next: 0,
    });
  });

  it("restores legacy all-AND / all-OR queries", () => {
    const and = parseFilterQuery("#Work & p1 & (today | overdue)");
    expect(and.next).toMatchObject({ project: "and", priorities: "and" });
    const or = parseFilterQuery("#Work | p1");
    expect(or.next.project).toBe("or");
  });
});

describe("operator precedence", () => {
  const empty = createEmptyFilterFields();
  const three = (
    next: Partial<FilterQueryFields["next"]>,
    prec: Partial<FilterQueryFields["prec"]> = {},
  ) =>
    fields({
      projectName: "Work",
      priorities: ["p1"],
      labels: ["a"],
      next: { ...empty.next, ...next },
      prec: { ...empty.prec, ...prec },
    });

  it("auto: AND binds tighter, written with explicit parens", () => {
    expect(buildFilterQuery(three({ project: "or", priorities: "and" }))).toBe(
      "#Work | (p1 & @a)",
    );
    expect(buildFilterQuery(three({ project: "and", priorities: "or" }))).toBe(
      "(#Work & p1) | @a",
    );
  });

  it("a rank makes that operator bind first", () => {
    const next = { project: "or", priorities: "and" } as const;
    expect(
      buildFilterQuery(three(next, { project: "2", priorities: "1" })),
    ).toBe("(#Work | p1) & @a");
    expect(
      buildFilterQuery(three(next, { project: "1", priorities: "2" })),
    ).toBe("#Work | (p1 & @a)");
  });

  it("equal ranks group left to right; any rank outranks auto", () => {
    const next = { project: "or", priorities: "and" } as const;
    expect(
      buildFilterQuery(three(next, { project: "1", priorities: "1" })),
    ).toBe("(#Work | p1) & @a");
    expect(buildFilterQuery(three(next, { project: "1" }))).toBe(
      "(#Work | p1) & @a",
    );
  });

  it("restores ranks from a parenthesized query, auto from a flat legacy one", () => {
    const ranked = parseFilterQuery("(#Work | p1) & @a");
    expect(ranked.prec).toMatchObject({ project: "2", priorities: "1" });
    expect(parseFilterQuery("#Work | p1 & @a").prec).toEqual(empty.prec);
    expect(parseFilterQuery("#Work | (p1 & @a)").prec).toEqual(empty.prec);
  });

  it("keeps the labels group inside a labels | status node", () => {
    const input = fields({
      priorities: ["p1"],
      labels: ["a", "b"],
      kanbanStatus: "todo",
      next: { ...empty.next, priorities: "and", labels: "or" },
      prec: { ...empty.prec, priorities: "1", labels: "2" },
    });
    expect(buildFilterQuery(input)).toBe("p1 & ((@a | @b) | @todo)");
    expect(buildFilterQuery(parseFilterQuery(buildFilterQuery(input)))).toBe(
      buildFilterQuery(input),
    );
  });

  it("round-trips every conjunction × rank combination of five fields", () => {
    const conjs = ["and", "or"] as const;
    const precs = ["auto", "1", "2", "3", "4"] as const;
    const full = fields({
      projectName: "Work",
      priorities: ["p1"],
      due: "next_3_days",
      labels: ["a"],
      kanbanStatus: "todo",
    });
    const keys = ["project", "priorities", "due", "labels"] as const;
    const pick = <T>(values: readonly T[], n: number): T[][] =>
      n === 0
        ? [[]]
        : pick(values, n - 1).flatMap((rest) =>
            values.map((v) => [...rest, v]),
          );

    for (const cs of pick(conjs, 4)) {
      for (const ps of pick(precs, 4)) {
        const input: FilterQueryFields = {
          ...full,
          next: Object.fromEntries(keys.map((k, i) => [k, cs[i]])) as never,
          prec: Object.fromEntries(keys.map((k, i) => [k, ps[i]])) as never,
        };
        const query = buildFilterQuery(input);
        expect(buildFilterQuery(parseFilterQuery(query))).toBe(query);
      }
    }
  });
});
