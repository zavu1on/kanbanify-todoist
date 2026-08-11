import { describe, expect, it, vi } from "vitest";
import type { IAttachmentGateway } from "../../../attachments/application/ports/IAttachmentGateway";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { Comment } from "../../domain/entities/Comment";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import type { ICommentGateway } from "../ports/ICommentGateway";
import { DeleteCommentUseCase } from "./DeleteCommentUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildComment = (attachment: Comment["attachment"] = null): Comment =>
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
  create: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
});

const buildAttachmentGateway = (): IAttachmentGateway => ({
  upload: vi.fn(),
  delete: vi.fn(),
  download: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("DeleteCommentUseCase", () => {
  it("throws InvalidCommentSessionError when no token is stored", async () => {
    const useCase = new DeleteCommentUseCase(
      buildCommentGateway(buildComment()),
      buildAttachmentGateway(),
      buildTokenStore(null),
    );

    await expect(useCase.execute("comment-1")).rejects.toThrow(
      InvalidCommentSessionError,
    );
  });

  it("deletes the comment through the gateway when it has no attachment", async () => {
    const commentGateway = buildCommentGateway(buildComment());
    const attachmentGateway = buildAttachmentGateway();
    const useCase = new DeleteCommentUseCase(
      commentGateway,
      attachmentGateway,
      buildTokenStore(token),
    );

    await useCase.execute("comment-1");

    expect(commentGateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "comment-1",
    );
    expect(attachmentGateway.delete).not.toHaveBeenCalled();
  });

  it("also deletes the attachment's file when the comment has one", async () => {
    const commentGateway = buildCommentGateway(
      buildComment({
        resourceType: "file",
        fileName: "report.pdf",
        fileType: "application/pdf",
        fileUrl: "https://files.todoist.com/report.pdf",
      }),
    );
    const attachmentGateway = buildAttachmentGateway();
    const useCase = new DeleteCommentUseCase(
      commentGateway,
      attachmentGateway,
      buildTokenStore(token),
    );

    await useCase.execute("comment-1");

    expect(attachmentGateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "https://files.todoist.com/report.pdf",
    );
    expect(commentGateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "comment-1",
    );
  });
});
