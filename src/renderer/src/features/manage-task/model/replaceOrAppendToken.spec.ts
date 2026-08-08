import { replaceOrAppendToken } from "./replaceOrAppendToken";

const context = {
  projects: [{ id: "work", name: "Work" }],
  reservedLabels: ["todo", "in-progress", "completed"],
};

describe("replaceOrAppendToken", () => {
  it("appends the token when the field has none yet", () => {
    expect(replaceOrAppendToken("Buy milk", "priority", "p1", context)).toBe(
      "Buy milk p1",
    );
  });

  it("replaces an existing token in place", () => {
    expect(replaceOrAppendToken("Buy milk p1", "priority", "p3", context)).toBe(
      "Buy milk p3",
    );
  });

  it("removes the token and collapses whitespace when tokenText is null", () => {
    expect(
      replaceOrAppendToken("Buy milk p1 today", "priority", null, context),
    ).toBe("Buy milk today");
  });

  it("is a no-op when there's no token to remove", () => {
    expect(replaceOrAppendToken("Buy milk", "priority", null, context)).toBe(
      "Buy milk",
    );
  });
});
