import { describe, expect, it } from "vitest";
import type { FilterQueryFields } from "../model/filterFormFields";
import { buildFilterQuery } from "./buildFilterQuery";
import { parseFilterQuery } from "./parseFilterQuery";

const EMPTY: FilterQueryFields = {
  projectName: null,
  priorities: [],
  due: null,
  labels: [],
};

describe("buildFilterQuery", () => {
  it("returns an empty string when every field is unset", () => {
    expect(buildFilterQuery(EMPTY)).toBe("");
  });

  it("builds a project-only query", () => {
    expect(buildFilterQuery({ ...EMPTY, projectName: "Work" })).toBe("#Work");
  });

  it("builds a single-priority query without parens", () => {
    expect(buildFilterQuery({ ...EMPTY, priorities: ["p1"] })).toBe("p1");
  });

  it("builds a multi-priority query grouped with |", () => {
    expect(buildFilterQuery({ ...EMPTY, priorities: ["p1", "p2"] })).toBe(
      "(p1 | p2)",
    );
  });

  it("builds each due variant's token", () => {
    expect(buildFilterQuery({ ...EMPTY, due: "today_overdue" })).toBe(
      "(today | overdue)",
    );
    expect(buildFilterQuery({ ...EMPTY, due: "today" })).toBe("today");
    expect(buildFilterQuery({ ...EMPTY, due: "overdue" })).toBe("overdue");
    expect(buildFilterQuery({ ...EMPTY, due: "next_7_days" })).toBe("7 days");
    expect(buildFilterQuery({ ...EMPTY, due: "no_date" })).toBe("no date");
  });

  it("builds a single-label query without parens", () => {
    expect(buildFilterQuery({ ...EMPTY, labels: ["deep"] })).toBe("@deep");
  });

  it("builds a multi-label query grouped with |", () => {
    expect(buildFilterQuery({ ...EMPTY, labels: ["deep", "urgent"] })).toBe(
      "(@deep | @urgent)",
    );
  });

  it("joins every set field with & in a fixed order", () => {
    const fields: FilterQueryFields = {
      projectName: "Work",
      priorities: ["p1", "p2"],
      due: "today_overdue",
      labels: ["deep"],
    };
    expect(buildFilterQuery(fields)).toBe(
      "#Work & (p1 | p2) & (today | overdue) & @deep",
    );
  });
});

describe("parseFilterQuery", () => {
  it("returns every field unset for an empty query", () => {
    expect(parseFilterQuery("")).toEqual(EMPTY);
  });

  it("returns every field unset for an unrecognized query, instead of throwing", () => {
    expect(() => parseFilterQuery("not a real filter clause")).not.toThrow();
  });

  const cases: FilterQueryFields[] = [
    EMPTY,
    { ...EMPTY, projectName: "Work" },
    { ...EMPTY, priorities: ["p1"] },
    { ...EMPTY, priorities: ["p1", "p2", "p3"] },
    { ...EMPTY, due: "today_overdue" },
    { ...EMPTY, due: "today" },
    { ...EMPTY, due: "overdue" },
    { ...EMPTY, due: "next_7_days" },
    { ...EMPTY, due: "no_date" },
    { ...EMPTY, labels: ["deep"] },
    { ...EMPTY, labels: ["deep", "urgent"] },
    {
      projectName: "Work",
      priorities: ["p1", "p2"],
      due: "today_overdue",
      labels: ["deep", "urgent"],
    },
  ];

  it.each(cases)("round-trips %j through buildFilterQuery", (fields) => {
    expect(parseFilterQuery(buildFilterQuery(fields))).toEqual(fields);
  });
});
