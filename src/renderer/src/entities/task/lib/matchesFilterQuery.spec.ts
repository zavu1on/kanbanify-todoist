import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskDTO } from "@/main/tasks";
import { taskMatchesFilterQuery } from "./matchesFilterQuery";

const NOW = "2026-09-02T14:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

const task: TaskDTO = {
  id: "1",
  title: "Task",
  description: "",
  projectId: "p1",
  priority: "p4",
  due: null,
  kanbanStatus: { level: "todo", hasConflict: false },
  labels: [],
  checked: false,
  parentId: null,
};

describe("taskMatchesFilterQuery", () => {
  it("matches an empty query unconditionally", () => {
    expect(taskMatchesFilterQuery("", task, null)).toBe(true);
  });

  it("fails a project clause the task isn't in", () => {
    expect(taskMatchesFilterQuery("#Work", task, "Personal")).toBe(false);
    expect(taskMatchesFilterQuery("#Work", task, "Work")).toBe(true);
  });

  it("fails a priority clause the task doesn't have", () => {
    expect(taskMatchesFilterQuery("p1", task, null)).toBe(false);
    expect(taskMatchesFilterQuery("p4", task, null)).toBe(true);
    expect(taskMatchesFilterQuery("(p1 | p4)", task, null)).toBe(true);
  });

  it("evaluates the 'today' due token against the task's actual due date", () => {
    expect(taskMatchesFilterQuery("today", task, null)).toBe(false);
    const dueToday = { ...task, due: { date: "2026-09-02", datetime: null } };
    expect(taskMatchesFilterQuery("today", dueToday, null)).toBe(true);
    const dueTomorrow = {
      ...task,
      due: { date: "2026-09-03", datetime: null },
    };
    expect(taskMatchesFilterQuery("today", dueTomorrow, null)).toBe(false);
  });

  it("requires at least one matching label out of an OR-group", () => {
    const withLabel = { ...task, labels: ["waiting"] };
    expect(taskMatchesFilterQuery("@waiting", task, null)).toBe(false);
    expect(taskMatchesFilterQuery("@waiting", withLabel, null)).toBe(true);
    expect(
      taskMatchesFilterQuery("(@waiting | @blocked)", withLabel, null),
    ).toBe(true);
  });

  it("requires every clause across fields to match (AND)", () => {
    const match = {
      ...task,
      priority: "p1" as const,
      labels: ["waiting"],
    };
    expect(taskMatchesFilterQuery("#Work & p1 & @waiting", match, "Work")).toBe(
      true,
    );
    expect(
      taskMatchesFilterQuery("#Work & p1 & @waiting", match, "Personal"),
    ).toBe(false);
  });

  it("matches when any clause across fields matches (OR)", () => {
    const onlyLabelMatches = {
      ...task,
      priority: "p4" as const,
      labels: ["waiting"],
    };
    expect(
      taskMatchesFilterQuery("p1 | @waiting", onlyLabelMatches, null),
    ).toBe(true);
    expect(taskMatchesFilterQuery("p1 | @waiting", task, null)).toBe(false);
  });
});
