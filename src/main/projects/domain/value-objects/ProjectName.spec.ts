import { describe, expect, it } from "vitest";
import { ProjectName } from "./ProjectName";

describe("ProjectName", () => {
  it("trims whitespace and accepts a valid name", () => {
    const result = ProjectName.safeParse("  Work  ");
    expect(result.success).toBe(true);
    expect(result.success && result.data.value).toBe("Work");
  });

  it("rejects an empty name", () => {
    const result = ProjectName.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 120 characters", () => {
    const result = ProjectName.safeParse("a".repeat(121));
    expect(result.success).toBe(false);
  });

  it("accepts a name exactly 120 characters long", () => {
    const result = ProjectName.safeParse("a".repeat(120));
    expect(result.success).toBe(true);
  });
});
