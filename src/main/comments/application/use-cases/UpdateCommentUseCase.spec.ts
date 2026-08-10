import { describe, expect, it, vi } from "vitest";
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

const existingComment = Comment.reconstitute({
  id: "comment-1",
  taskId: "task-1",
  content: "Original",
  postedAt: new Date("2026-08-01T12:00:00.000Z"),
  attachment: null,
});

const buildGateway = (): ICommentGateway => ({
  listComments: vi.fn(),
  getComment: vi.fn().mockResolvedValue(existingComment),
  create: vi.fn(),
  save: vi.fn().mockImplementation((_token, comment: Comment) => comment),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("UpdateCommentUseCase", () => {
  it("throws InvalidCommentSessionError when no token is stored", async () => {
    const useCase = new UpdateCommentUseCase(
      buildGateway(),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new UpdateCommentInput("comment-1", "Edited")),
    ).rejects.toThrow(InvalidCommentSessionError);
  });

  it("fetches the existing comment, updates its content, and persists it", async () => {
    const gateway = buildGateway();
    const useCase = new UpdateCommentUseCase(gateway, buildTokenStore(token));

    const result = await useCase.execute(
      new UpdateCommentInput("comment-1", "Edited"),
    );

    expect(gateway.getComment).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "comment-1",
    );
    expect(gateway.save).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ id: "comment-1", content: "Edited" }),
    );
    expect(result.content).toBe("Edited");
  });

  it("throws InvalidCommentContentError for empty content without calling save", async () => {
    const gateway = buildGateway();
    const useCase = new UpdateCommentUseCase(gateway, buildTokenStore(token));

    await expect(
      useCase.execute(new UpdateCommentInput("comment-1", "   ")),
    ).rejects.toThrow(InvalidCommentContentError);
    expect(gateway.save).not.toHaveBeenCalled();
  });
});
