import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import type { ICommentGateway } from "../ports/ICommentGateway";
import { DeleteCommentUseCase } from "./DeleteCommentUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (): ICommentGateway => ({
  listComments: vi.fn(),
  getComment: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
});

describe("DeleteCommentUseCase", () => {
  it("throws InvalidCommentSessionError when no token is stored", async () => {
    const useCase = new DeleteCommentUseCase(
      buildGateway(),
      buildTokenStore(null),
    );

    await expect(useCase.execute("comment-1")).rejects.toThrow(
      InvalidCommentSessionError,
    );
  });

  it("deletes the comment through the gateway", async () => {
    const gateway = buildGateway();
    const useCase = new DeleteCommentUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    await useCase.execute("comment-1");

    expect(gateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "comment-1",
    );
  });
});
