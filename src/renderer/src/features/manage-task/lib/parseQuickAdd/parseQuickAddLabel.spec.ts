import dayjs from "dayjs";
import { parseQuickAdd } from "./parseQuickAdd";

const NOW = dayjs("2026-08-05T09:00:00");

const context = {
  projects: [],
  reservedLabels: ["todo", "in-progress", "completed"],
};

describe("parseQuickAdd — label", () => {
  it("excludes reserved kanban labels from parsed labels", () => {
    const result = parseQuickAdd("Ship it @todo @urgent", context, NOW);

    expect(result.labels).toEqual(["urgent"]);
  });

  it("recognizes a Cyrillic label", () => {
    const result = parseQuickAdd("Купить молоко @важное", context, NOW);

    expect(result.labels).toEqual(["важное"]);
    expect(result.cleanTitle).toBe("Купить молоко");
  });
});
