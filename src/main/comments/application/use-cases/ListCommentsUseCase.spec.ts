import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import type { ICommentGateway } from "../ports/ICommentGateway";
import { ListCommentsUseCase } from "./ListCommentsUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (): ICommentGateway => ({
  listComments: vi.fn().mockResolvedValue([]),
  getComment: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("ListCommentsUseCase", () => {
  it("throws InvalidCommentSessionError when no token is stored", async () => {
    const useCase = new ListCommentsUseCase(
      buildGateway(),
      buildTokenStore(null),
    );

    await expect(useCase.execute("task-1")).rejects.toThrow(
      InvalidCommentSessionError,
    );
  });

  it("delegates to the gateway with the task id", async () => {
    const gateway = buildGateway();
    const useCase = new ListCommentsUseCase(gateway, buildTokenStore(token));

    await useCase.execute("task-1");

    expect(gateway.listComments).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "task-1",
    );
  });
});
