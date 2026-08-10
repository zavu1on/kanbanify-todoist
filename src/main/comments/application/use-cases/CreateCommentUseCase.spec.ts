import { describe, expect, it, vi } from "vitest";
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

const buildGateway = (): ICommentGateway => ({
  listComments: vi.fn(),
  getComment: vi.fn(),
  create: vi.fn().mockImplementation((_token, comment: Comment) => comment),
  save: vi.fn(),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("CreateCommentUseCase", () => {
  it("throws InvalidCommentSessionError when no token is stored", async () => {
    const useCase = new CreateCommentUseCase(
      buildGateway(),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new CreateCommentInput("task-1", "Looks good")),
    ).rejects.toThrow(InvalidCommentSessionError);
  });

  it("builds a comment from the entity factory and persists it via the gateway", async () => {
    const gateway = buildGateway();
    const useCase = new CreateCommentUseCase(gateway, buildTokenStore(token));

    const result = await useCase.execute(
      new CreateCommentInput("task-1", "Looks good"),
    );

    expect(gateway.create).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ id: "", taskId: "task-1" }),
    );
    expect(result.content).toBe("Looks good");
  });

  it("throws InvalidCommentContentError for empty content without calling the gateway", async () => {
    const gateway = buildGateway();
    const useCase = new CreateCommentUseCase(gateway, buildTokenStore(token));

    await expect(
      useCase.execute(new CreateCommentInput("task-1", "   ")),
    ).rejects.toThrow(InvalidCommentContentError);
    expect(gateway.create).not.toHaveBeenCalled();
  });
});
