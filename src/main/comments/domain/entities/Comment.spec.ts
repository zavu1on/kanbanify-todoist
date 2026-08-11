import { describe, expect, it } from "vitest";
import { InvalidCommentContentError } from "../errors/InvalidCommentContentError";
import { Comment } from "./Comment";

describe("Comment.create", () => {
  it("builds a comment with an empty id and no attachment", () => {
    const comment = Comment.create({ taskId: "task-1", content: "Looks good" });

    expect(comment.id).toBe("");
    expect(comment.taskId).toBe("task-1");
    expect(comment.content).toBe("Looks good");
    expect(comment.attachment).toBeNull();
  });

  it("throws InvalidCommentContentError for empty content", () => {
    expect(() => Comment.create({ taskId: "task-1", content: "   " })).toThrow(
      InvalidCommentContentError,
    );
  });
});

describe("Comment.reconstitute", () => {
  it("rebuilds a comment from trusted data, including its attachment", () => {
    const postedAt = new Date("2026-08-01T12:00:00.000Z");
    const comment = Comment.reconstitute({
      id: "comment-1",
      taskId: "task-1",
      content: "Looks good",
      postedAt,
      attachment: {
        resourceType: "file",
        fileName: "report.pdf",
        fileType: "application/pdf",
        fileUrl: "https://example.com/report.pdf",
      },
    });

    expect(comment.id).toBe("comment-1");
    expect(comment.postedAt).toBe(postedAt);
    expect(comment.attachment).toEqual({
      resourceType: "file",
      fileName: "report.pdf",
      fileType: "application/pdf",
      fileUrl: "https://example.com/report.pdf",
    });
  });
});

describe("Comment#update", () => {
  it("replaces the content", () => {
    const comment = Comment.create({ taskId: "task-1", content: "Original" });

    comment.update("Edited");

    expect(comment.content).toBe("Edited");
  });

  it("throws InvalidCommentContentError for empty content and leaves the original untouched", () => {
    const comment = Comment.create({ taskId: "task-1", content: "Original" });

    expect(() => comment.update("   ")).toThrow(InvalidCommentContentError);
    expect(comment.content).toBe("Original");
  });
});

describe("Comment#replaceAttachment", () => {
  it("attaches a file to a comment that had none", () => {
    const comment = Comment.create({ taskId: "task-1", content: "Original" });

    comment.replaceAttachment({
      resourceType: "file",
      fileName: "report.pdf",
      fileType: "application/pdf",
      fileUrl: "https://example.com/report.pdf",
    });

    expect(comment.attachment).toEqual({
      resourceType: "file",
      fileName: "report.pdf",
      fileType: "application/pdf",
      fileUrl: "https://example.com/report.pdf",
    });
  });

  it("detaches the current file when passed null", () => {
    const comment = Comment.create({
      taskId: "task-1",
      content: "Original",
      attachment: {
        resourceType: "file",
        fileName: "report.pdf",
        fileType: "application/pdf",
        fileUrl: "https://example.com/report.pdf",
      },
    });

    comment.replaceAttachment(null);

    expect(comment.attachment).toBeNull();
  });
});
