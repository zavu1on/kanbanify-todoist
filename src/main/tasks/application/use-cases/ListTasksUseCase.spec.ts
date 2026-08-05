import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";
import { ListTasksUseCase } from "./ListTasksUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (page: TaskListPage): ITaskGateway => ({
  listTasks: vi.fn().mockResolvedValue(page),
  updateTaskStatus: vi.fn(),
});

describe("ListTasksUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new ListTasksUseCase(
      buildGateway({ tasks: [], nextCursor: null }),
      buildTokenStore(null),
    );

    await expect(useCase.execute(null)).rejects.toThrow(
      InvalidTaskSessionError,
    );
  });

  it("forwards the token and cursor to the gateway and returns its page", async () => {
    const page: TaskListPage = { tasks: [], nextCursor: "next-cursor" };
    const gateway = buildGateway(page);
    const useCase = new ListTasksUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute("current-cursor");

    expect(gateway.listTasks).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "current-cursor",
    );
    expect(result).toBe(page);
  });
});
