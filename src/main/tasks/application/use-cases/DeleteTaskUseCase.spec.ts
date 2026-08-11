import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway } from "../ports/ITaskGateway";
import { DeleteTaskUseCase } from "./DeleteTaskUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (): ITaskGateway => ({
  listTasks: vi.fn(),
  listTasksByFilter: vi.fn(),
  getTask: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  move: vi.fn(),
  close: vi.fn(),
  delete: vi.fn(),
});

describe("DeleteTaskUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new DeleteTaskUseCase(
      buildGateway(),
      buildTokenStore(null),
    );

    await expect(useCase.execute("task-1")).rejects.toThrow(
      InvalidTaskSessionError,
    );
  });

  it("deletes the task through the gateway", async () => {
    const gateway = buildGateway();
    const useCase = new DeleteTaskUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    await useCase.execute("task-1");

    expect(gateway.delete).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "task-1",
    );
  });
});
