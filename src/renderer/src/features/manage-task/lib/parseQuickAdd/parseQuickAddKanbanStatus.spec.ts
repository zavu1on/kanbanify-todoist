import dayjs from "dayjs";
import { parseQuickAdd } from "./parseQuickAdd";
import { buildKanbanStatusToken } from "./parseQuickAddKanbanStatus";

const NOW = dayjs("2026-08-05T09:00:00");

const context = {
  projects: [],
  reservedLabels: ["todo", "in-progress", "completed"],
};

describe("parseQuickAdd — kanbanStatus", () => {
  it("recognizes a reserved label as the Kanban status, not a regular label", () => {
    const result = parseQuickAdd("Ship it @todo", context, NOW);

    expect(result.kanbanStatus).toBe("todo");
    expect(result.labels).toEqual([]);
    expect(result.segments).toEqual([
      { text: "Ship it ", type: "plain" },
      { text: "@todo", type: "kanbanStatus" },
    ]);
  });

  it("keeps the last kanban status token when it appears more than once", () => {
    const result = parseQuickAdd("Ship it @todo @completed", context, NOW);

    expect(result.kanbanStatus).toBe("completed");
  });
});

describe("buildKanbanStatusToken", () => {
  it("builds an @token from the status level", () => {
    expect(buildKanbanStatusToken("in-progress")).toBe("@in-progress");
  });
});
