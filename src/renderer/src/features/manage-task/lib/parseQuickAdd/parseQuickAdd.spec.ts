import dayjs from "dayjs";
import { parseQuickAdd } from "./parseQuickAdd";

// Wednesday — a fixed reference point so weekday-keyword resolution is deterministic.
const NOW = dayjs("2026-08-05T09:00:00");

const context = {
  projects: [
    { id: "inbox", name: "Inbox" },
    { id: "work", name: "Work" },
  ],
  reservedLabels: ["todo", "in-progress", "completed"],
};

describe("parseQuickAdd", () => {
  it("returns the whole text as a plain title when nothing matches", () => {
    const result = parseQuickAdd("Buy milk", context, NOW);

    expect(result.cleanTitle).toBe("Buy milk");
    expect(result.priority).toBeNull();
    expect(result.due).toBeNull();
    expect(result.projectId).toBeNull();
    expect(result.labels).toEqual([]);
    expect(result.segments).toEqual([{ text: "Buy milk", type: "plain" }]);
  });

  it("parses priority, label and project tokens together and strips them all from the title", () => {
    const result = parseQuickAdd("Write report @urgent #Work p1", context, NOW);

    expect(result.cleanTitle).toBe("Write report");
    expect(result.priority).toBe("p1");
    expect(result.projectId).toBe("work");
    expect(result.labels).toEqual(["urgent"]);
  });

  it("builds highlightable segments preserving original order and text across attributes", () => {
    const result = parseQuickAdd("Call mom @family tomorrow", context, NOW);

    expect(result.segments).toEqual([
      { text: "Call mom ", type: "plain" },
      { text: "@family", type: "label" },
      { text: " ", type: "plain" },
      { text: "tomorrow", type: "due" },
    ]);
  });
});
