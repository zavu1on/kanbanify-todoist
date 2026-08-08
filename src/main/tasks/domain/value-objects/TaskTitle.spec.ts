import { describe, expect, it } from "vitest";
import { TaskTitle } from "./TaskTitle";

describe("TaskTitle", () => {
  it("trims whitespace and accepts a valid title", () => {
    const result = TaskTitle.safeParse("  Write report  ");
    expect(result.success).toBe(true);
    expect(result.success && result.data.value).toBe("Write report");
  });

  it("rejects an empty title", () => {
    const result = TaskTitle.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("rejects a title longer than 500 characters", () => {
    const result = TaskTitle.safeParse("a".repeat(501));
    expect(result.success).toBe(false);
  });

  it("accepts a title exactly 500 characters long", () => {
    const result = TaskTitle.safeParse("a".repeat(500));
    expect(result.success).toBe(true);
  });
});
