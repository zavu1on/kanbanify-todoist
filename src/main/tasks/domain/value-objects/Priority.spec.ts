import { describe, expect, it } from "vitest";
import { Priority } from "./Priority";

describe("Priority.fromApiValue", () => {
  // Todoist's API priority is the inverse of the interface labels — the
  // single case this codebase is most likely to get backwards.
  it.each([
    [4, "p1"],
    [3, "p2"],
    [2, "p3"],
    [1, "p4"],
  ] as const)("maps API value %i to %s", (apiValue, expectedLevel) => {
    expect(Priority.fromApiValue(apiValue).level).toBe(expectedLevel);
  });
});

describe("Priority#toApiValue", () => {
  it.each([
    ["p1", 4],
    ["p2", 3],
    ["p3", 2],
    ["p4", 1],
  ] as const)(
    "maps interface level %s back to API value %i",
    (level, apiValue) => {
      expect(Priority.of(level).toApiValue()).toBe(apiValue);
    },
  );
});
