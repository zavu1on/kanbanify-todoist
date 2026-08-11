import { describe, expect, it, vi } from "vitest";
import type { IAttachmentGateway } from "../../../attachments/application/ports/IAttachmentGateway";
import { Attachment } from "../../../attachments/domain/entities/Attachment";
import { AttachmentTooLargeError } from "../../../attachments/domain/errors/AttachmentTooLargeError";
import { MAX_ATTACHMENT_SIZE_BYTES } from "../../../attachments/domain/value-objects/AttachmentSize";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type { Comment } from "../../domain/entities/Comment";
import { InvalidCommentContentError } from "../../domain/errors/InvalidCommentContentError";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import { CreateCommentInput } from "../dtos/CreateCommentInput";
import type { ICommentGateway } from "../ports/ICommentGateway";
import { CreateCommentUseCase } from "./CreateCommentUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildCommentGateway = (): ICommentGateway => ({
  listComments: vi.fn(),
  getComment: vi.fn(),
  create: vi.fn().mockImplementation((_token, comment: Comment) => comment),
  save: vi.fn(),
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

describe("CreateCommentUseCase", () => {
  it("throws InvalidCommentSessionError when no token is stored", async () => {
    const useCase = new CreateCommentUseCase(
      buildCommentGateway(),
      buildAttachmentGateway(),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new CreateCommentInput("task-1", "Looks good")),
    ).rejects.toThrow(InvalidCommentSessionError);
  });

  it("builds a comment from the entity factory and persists it via the gateway", async () => {
    const commentGateway = buildCommentGateway();
    const useCase = new CreateCommentUseCase(
      commentGateway,
      buildAttachmentGateway(),
      buildTokenStore(token),
    );

    const result = await useCase.execute(
      new CreateCommentInput("task-1", "Looks good"),
    );

    expect(commentGateway.create).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ id: "", taskId: "task-1" }),
    );
    expect(result.content).toBe("Looks good");
  });

  it("throws InvalidCommentContentError for empty content without calling the gateway", async () => {
    const commentGateway = buildCommentGateway();
    const useCase = new CreateCommentUseCase(
      commentGateway,
      buildAttachmentGateway(),
      buildTokenStore(token),
    );

    await expect(
      useCase.execute(new CreateCommentInput("task-1", "   ")),
    ).rejects.toThrow(InvalidCommentContentError);
    expect(commentGateway.create).not.toHaveBeenCalled();
  });

  it("uploads the attachment and attaches it to the created comment", async () => {
    const commentGateway = buildCommentGateway();
    const attachmentGateway = buildAttachmentGateway();
    const useCase = new CreateCommentUseCase(
      commentGateway,
      attachmentGateway,
      buildTokenStore(token),
    );
    const bytes = Buffer.from("pdf-bytes");

    const result = await useCase.execute(
      new CreateCommentInput("task-1", "See attached", {
        fileName: "report.pdf",
        bytes,
      }),
    );

    expect(attachmentGateway.upload).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ fileName: "report.pdf" }),
      bytes,
    );
    expect(result.attachment).toEqual({
      resourceType: "file",
      fileName: "report.pdf",
      fileType: "application/pdf",
      fileUrl: "https://files.todoist.com/report.pdf",
    });
  });

  it("throws AttachmentTooLargeError before uploading an oversized file", async () => {
    const commentGateway = buildCommentGateway();
    const attachmentGateway = buildAttachmentGateway();
    const useCase = new CreateCommentUseCase(
      commentGateway,
      attachmentGateway,
      buildTokenStore(token),
    );

    await expect(
      useCase.execute(
        new CreateCommentInput("task-1", "See attached", {
          fileName: "huge.zip",
          bytes: Buffer.alloc(MAX_ATTACHMENT_SIZE_BYTES + 1),
        }),
      ),
    ).rejects.toThrow(AttachmentTooLargeError);
    expect(attachmentGateway.upload).not.toHaveBeenCalled();
    expect(commentGateway.create).not.toHaveBeenCalled();
  });
});
