import dayjs from "dayjs";
import { parseQuickAdd } from "./parseQuickAdd";
import { buildProjectToken } from "./parseQuickAddProject";

const NOW = dayjs("2026-08-05T09:00:00");

const context = {
  projects: [
    { id: "inbox", name: "Inbox" },
    { id: "work", name: "Work" },
  ],
  reservedLabels: ["todo", "in-progress", "completed"],
};

describe("parseQuickAdd — project", () => {
  it("ignores a #project token that doesn't match any known project", () => {
    const result = parseQuickAdd("Buy milk #nonexistent", context, NOW);

    expect(result.projectId).toBeNull();
    expect(result.cleanTitle).toBe("Buy milk #nonexistent");
  });
});

describe("buildProjectToken", () => {
  it("builds a #token for a single-word project name", () => {
    expect(buildProjectToken("Work")).toBe("#Work");
  });

  it("returns null for a multi-word project name (can't round-trip as plain text)", () => {
    expect(buildProjectToken("Home Renovation")).toBeNull();
  });
});
