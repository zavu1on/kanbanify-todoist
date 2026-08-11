import { describe, expect, it, vi } from "vitest";
import type { IAttachmentGateway } from "../../../attachments/application/ports/IAttachmentGateway";
import { Attachment } from "../../../attachments/domain/entities/Attachment";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { Comment } from "../../domain/entities/Comment";
import { InvalidCommentContentError } from "../../domain/errors/InvalidCommentContentError";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import { UpdateCommentInput } from "../dtos/UpdateCommentInput";
import type { ICommentGateway } from "../ports/ICommentGateway";
import { UpdateCommentUseCase } from "./UpdateCommentUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildExistingComment = (
  attachment: Comment["attachment"] = null,
): Comment =>
  Comment.reconstitute({
    id: "comment-1",
    taskId: "task-1",
    content: "Original",
    postedAt: new Date("2026-08-01T12:00:00.000Z"),
    attachment,
  });

const buildCommentGateway = (existingComment: Comment): ICommentGateway => ({
  listComments: vi.fn(),
  getComment: vi.fn().mockResolvedValue(existingComment),
  create: vi.fn().mockImplementation((_token, comment: Comment) => comment),
  save: vi.fn().mockImplementation((_token, comment: Comment) => comment),
  delete: vi.fn(),
});

const buildAttachmentGateway = (): IAttachmentGateway => ({
  upload: vi.fn().mockImplementation((_token, attachment: Attachment) =>
    Attachment.reconstitute({
      fileName: attachment.fileName,
      sizeBytes: attachment.sizeBytes,
      resourceType: "file",
      fileType: "application/pdf",
      fileUrl: "https://files.todoist.com/report.pdf",
    }),
  ),
  delete: vi.fn(),
  download: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("UpdateCommentUseCase", () => {
  it("throws InvalidCommentSessionError when no token is stored", async () => {
    const useCase = new UpdateCommentUseCase(
      buildCommentGateway(buildExistingComment()),
      buildAttachmentGateway(),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new UpdateCommentInput("comment-1", "Edited")),
    ).rejects.toThrow(InvalidCommentSessionError);
  });

  it("fetches the existing comment, updates its content, and saves it in place", async () => {
    const commentGateway = buildCommentGateway(buildExistingComment());
    const useCase = new UpdateCommentUseCase(
      commentGateway,
      buildAttachmentGateway(),
      buildTokenStore(token),
    );

    const result = await useCase.execute(
      new UpdateCommentInput("comment-1", "Edited"),
    );

    expect(commentGateway.getComment).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "comment-1",
    );
    expect(commentGateway.save).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ id: "comment-1", content: "Edited" }),
    );
    expect(commentGateway.delete).not.toHaveBeenCalled();
    expect(result.content).toBe("Edited");
  });

  it("throws InvalidCommentContentError for empty content without calling save", async () => {
    const commentGateway = buildCommentGateway(buildExistingComment());
    const useCase = new UpdateCommentUseCase(
      commentGateway,
      buildAttachmentGateway(),
      buildTokenStore(token),
    );

    await expect(
      useCase.execute(new UpdateCommentInput("comment-1", "   ")),
    ).rejects.toThrow(InvalidCommentContentError);
    expect(commentGateway.save).not.toHaveBeenCalled();
  });

  it("leaves the attachment untouched when the change type is 'keep'", async () => {
    const existingAttachment = {
      resourceType: "file",
      fileName: "old.pdf",
      fileType: "application/pdf",
      fileUrl: "https://files.todoist.com/old.pdf",
    };
    const commentGateway = buildCommentGateway(
      buildExistingComment(existingAttachment),
    );
    const attachmentGateway = buildAttachmentGateway();
    const useCase = new UpdateCommentUseCase(
      commentGateway,
      attachmentGateway,
      buildTokenStore(token),
    );

    const result = await useCase.execute(
      new UpdateCommentInput("comment-1", "Edited"),
    );

    expect(attachmentGateway.delete).not.toHaveBeenCalled();
    expect(attachmentGateway.upload).not.toHaveBeenCalled();
    expect(commentGateway.delete).not.toHaveBeenCalled();
    expect(result.attachment).toEqual(existingAttachment);
  });

  it("deletes the file and the comment, then recreates it without an attachment when removed", async () => {
    const existingAttachment = {
      resourceType: "file",
      fileName: "old.pdf",
      fileType: "application/pdf",
      fileUrl: "https://files.todoist.com/old.pdf",
    };
    const commentGateway = buildCommentGateway(
      buildExistingComment(existingAttachment),
    );
    const attachmentGateway = buildAttachmentGateway();
    const useCase = new UpdateCommentUseCase(
      commentGateway,
      attachmentGateway,
      buildTokenStore(token),
    );

    const result = await useCase.execute(
      new UpdateCommentInput("comment-1", "Edited", { type: "remove" }),
    );

    expect(attachmentGateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "https://files.todoist.com/old.pdf",
    );
    expect(commentGateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "comment-1",
    );
    expect(commentGateway.create).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ id: "", taskId: "task-1", content: "Edited" }),
    );
    expect(result.attachment).toBeNull();
  });

  it("deletes the old file and comment, then recreates it with the replacement attachment", async () => {
    const existingAttachment = {
      resourceType: "file",
      fileName: "old.pdf",
      fileType: "application/pdf",
      fileUrl: "https://files.todoist.com/old.pdf",
    };
    const commentGateway = buildCommentGateway(
      buildExistingComment(existingAttachment),
    );
    const attachmentGateway = buildAttachmentGateway();
    const useCase = new UpdateCommentUseCase(
      commentGateway,
      attachmentGateway,
      buildTokenStore(token),
    );
    const bytes = Buffer.from("pdf-bytes");

    const result = await useCase.execute(
      new UpdateCommentInput("comment-1", "Edited", {
        type: "replace",
        fileName: "new.pdf",
        bytes,
      }),
    );

    expect(attachmentGateway.upload).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ fileName: "new.pdf" }),
      bytes,
    );
    expect(attachmentGateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "https://files.todoist.com/old.pdf",
    );
    expect(commentGateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "comment-1",
    );
    expect(result.attachment).toEqual({
      resourceType: "file",
      fileName: "new.pdf",
      fileType: "application/pdf",
      fileUrl: "https://files.todoist.com/report.pdf",
    });
  });

  it("does not delete anything when the replacement upload fails", async () => {
    const existingAttachment = {
      resourceType: "file",
      fileName: "old.pdf",
      fileType: "application/pdf",
      fileUrl: "https://files.todoist.com/old.pdf",
    };
    const commentGateway = buildCommentGateway(
      buildExistingComment(existingAttachment),
    );
    const attachmentGateway = buildAttachmentGateway();
    vi.mocked(attachmentGateway.upload).mockRejectedValue(
      new Error("network down"),
    );
    const useCase = new UpdateCommentUseCase(
      commentGateway,
      attachmentGateway,
      buildTokenStore(token),
    );

    await expect(
      useCase.execute(
        new UpdateCommentInput("comment-1", "Edited", {
          type: "replace",
          fileName: "new.pdf",
          bytes: Buffer.from("pdf-bytes"),
        }),
      ),
    ).rejects.toThrow("network down");
    expect(attachmentGateway.delete).not.toHaveBeenCalled();
    expect(commentGateway.delete).not.toHaveBeenCalled();
  });
});
