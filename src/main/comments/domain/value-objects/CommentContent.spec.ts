import { describe, expect, it } from "vitest";
import { CommentContent } from "./CommentContent";

describe("CommentContent", () => {
  it("trims whitespace and accepts valid content", () => {
    const result = CommentContent.safeParse("  Looks good  ");
    expect(result.success).toBe(true);
    expect(result.success && result.data.value).toBe("Looks good");
  });

  it("rejects empty content", () => {
    const result = CommentContent.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("rejects content longer than 15000 characters", () => {
    const result = CommentContent.safeParse("a".repeat(15001));
    expect(result.success).toBe(false);
  });

  it("accepts content exactly 15000 characters long", () => {
    const result = CommentContent.safeParse("a".repeat(15000));
    expect(result.success).toBe(true);
  });
});
