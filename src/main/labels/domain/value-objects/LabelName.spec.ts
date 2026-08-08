import { describe, expect, it } from "vitest";
import { LabelName } from "./LabelName";

describe("LabelName", () => {
  it("trims whitespace and accepts a valid name", () => {
    const result = LabelName.safeParse("  urgent  ");
    expect(result.success).toBe(true);
    expect(result.success && result.data.value).toBe("urgent");
  });

  it("rejects an empty name", () => {
    const result = LabelName.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 128 characters", () => {
    const result = LabelName.safeParse("a".repeat(129));
    expect(result.success).toBe(false);
  });

  it("accepts a name exactly 128 characters long", () => {
    const result = LabelName.safeParse("a".repeat(128));
    expect(result.success).toBe(true);
  });
});
