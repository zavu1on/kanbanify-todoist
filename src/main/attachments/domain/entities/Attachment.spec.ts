import { describe, expect, it } from "vitest";
import { AttachmentTooLargeError } from "../errors/AttachmentTooLargeError";
import { MAX_ATTACHMENT_SIZE_BYTES } from "../value-objects/AttachmentSize";
import { Attachment } from "./Attachment";

describe("Attachment.create", () => {
  it("builds a not-yet-uploaded attachment", () => {
    const attachment = Attachment.create({
      fileName: "report.pdf",
      sizeBytes: 1024,
    });

    expect(attachment.fileName).toBe("report.pdf");
    expect(attachment.sizeBytes).toBe(1024);
    expect(attachment.fileUrl).toBeNull();
    expect(attachment.resourceType).toBeNull();
  });

  it("throws AttachmentTooLargeError when the file exceeds the Free-plan cap", () => {
    expect(() =>
      Attachment.create({
        fileName: "huge.zip",
        sizeBytes: MAX_ATTACHMENT_SIZE_BYTES + 1,
      }),
    ).toThrow(AttachmentTooLargeError);
  });
});

describe("Attachment.reconstitute", () => {
  it("rebuilds an attachment from trusted upload-response data", () => {
    const attachment = Attachment.reconstitute({
      fileName: "report.pdf",
      sizeBytes: 1024,
      resourceType: "file",
      fileType: "application/pdf",
      fileUrl: "https://files.todoist.com/report.pdf",
    });

    expect(attachment.fileName).toBe("report.pdf");
    expect(attachment.fileUrl).toBe("https://files.todoist.com/report.pdf");
    expect(attachment.resourceType).toBe("file");
  });

  it("does not re-validate size", () => {
    expect(() =>
      Attachment.reconstitute({
        fileName: "huge.zip",
        sizeBytes: MAX_ATTACHMENT_SIZE_BYTES + 1,
        resourceType: "file",
        fileType: null,
        fileUrl: "https://files.todoist.com/huge.zip",
      }),
    ).not.toThrow();
  });
});
