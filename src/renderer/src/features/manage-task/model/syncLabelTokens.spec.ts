import { syncLabelTokens } from "./syncLabelTokens";

const context = {
  projects: [],
  reservedLabels: ["todo", "in-progress", "completed"],
};

describe("syncLabelTokens", () => {
  it("appends label tokens when the title has none yet", () => {
    expect(syncLabelTokens("Buy milk", ["errand"], context)).toBe(
      "Buy milk @errand",
    );
  });

  it("replaces the whole label token set", () => {
    expect(
      syncLabelTokens("Buy milk @errand", ["urgent", "home"], context),
    ).toBe("Buy milk @urgent @home");
  });

  it("strips all label tokens and collapses whitespace when newLabels is empty", () => {
    expect(syncLabelTokens("Buy milk @errand today", [], context)).toBe(
      "Buy milk today",
    );
  });
});
