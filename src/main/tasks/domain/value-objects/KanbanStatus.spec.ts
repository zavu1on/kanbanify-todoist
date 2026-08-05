import { describe, expect, it } from "vitest";
import { KanbanStatus } from "./KanbanStatus";

describe("KanbanStatus.resolve", () => {
  it("returns none without conflict when no reserved label is present", () => {
    const status = KanbanStatus.resolve(["errand"]);
    expect(status.level).toBe("none");
    expect(status.hasConflict).toBe(false);
  });

  it("returns the single reserved label as status", () => {
    const status = KanbanStatus.resolve(["errand", "in-progress"]);
    expect(status.level).toBe("in-progress");
    expect(status.hasConflict).toBe(false);
  });

  it("picks the rightmost column and flags a conflict when several reserved labels are present", () => {
    const status = KanbanStatus.resolve(["todo", "completed", "in-progress"]);
    expect(status.level).toBe("completed");
    expect(status.hasConflict).toBe(true);
  });
});

describe("KanbanStatus.stripReserved", () => {
  it("removes every reserved label but keeps ordinary ones", () => {
    expect(KanbanStatus.stripReserved(["errand", "todo", "urgent"])).toEqual([
      "errand",
      "urgent",
    ]);
  });
});

describe("KanbanStatus.isKanbanStatusLevel", () => {
  it("accepts every known level", () => {
    expect(KanbanStatus.isKanbanStatusLevel("todo")).toBe(true);
    expect(KanbanStatus.isKanbanStatusLevel("none")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(KanbanStatus.isKanbanStatusLevel("archived")).toBe(false);
    expect(KanbanStatus.isKanbanStatusLevel(42)).toBe(false);
  });
});

describe("KanbanStatus#applyTo", () => {
  it("drops the previous reserved label and adds the new one", () => {
    expect(KanbanStatus.of("completed").applyTo(["errand", "todo"])).toEqual([
      "errand",
      "completed",
    ]);
  });

  it("only drops the reserved label when the target status is none", () => {
    expect(KanbanStatus.of("none").applyTo(["errand", "in-progress"])).toEqual([
      "errand",
    ]);
  });
});
