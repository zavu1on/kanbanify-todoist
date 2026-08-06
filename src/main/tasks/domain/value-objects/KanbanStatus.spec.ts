import { describe, expect, it } from "vitest";
import { KanbanStatus } from "./KanbanStatus";

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
