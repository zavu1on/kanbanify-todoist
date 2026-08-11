import { describe, expect, it } from "vitest";
import { AttachmentSize, MAX_ATTACHMENT_SIZE_BYTES } from "./AttachmentSize";

describe("AttachmentSize.safeParse", () => {
  it("accepts a size within the cap", () => {
    const result = AttachmentSize.safeParse(1024);
    expect(result.success).toBe(true);
  });

  it("rejects a size above the cap", () => {
    const result = AttachmentSize.safeParse(MAX_ATTACHMENT_SIZE_BYTES + 1);
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive size", () => {
    const result = AttachmentSize.safeParse(0);
    expect(result.success).toBe(false);
  });
});
