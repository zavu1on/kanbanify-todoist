import { describe, expect, it } from "vitest";
import { FilterTitle } from "./FilterTitle";

describe("FilterTitle", () => {
  it("trims whitespace and accepts a valid title", () => {
    const result = FilterTitle.safeParse("  Urgent work  ");
    expect(result.success).toBe(true);
    expect(result.success && result.data.value).toBe("Urgent work");
  });

  it("rejects an empty title", () => {
    const result = FilterTitle.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("rejects a title longer than 120 characters", () => {
    const result = FilterTitle.safeParse("a".repeat(121));
    expect(result.success).toBe(false);
  });

  it("accepts a title exactly 120 characters long", () => {
    const result = FilterTitle.safeParse("a".repeat(120));
    expect(result.success).toBe(true);
  });
});
