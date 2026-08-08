import dayjs from "dayjs";
import { parseQuickAdd } from "./parseQuickAdd";

const NOW = dayjs("2026-08-05T09:00:00");

const context = {
  projects: [],
  reservedLabels: ["todo", "in-progress", "completed"],
};

describe("parseQuickAdd — priority", () => {
  it("keeps the last match when a priority token appears more than once", () => {
    const result = parseQuickAdd("Task p1 p3", context, NOW);

    expect(result.priority).toBe("p3");
  });
});
