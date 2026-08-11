import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";
import { CountUnfinishedTasksUseCase } from "./CountUnfinishedTasksUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (pages: TaskListPage[]): ITaskGateway => {
  const listTasks = vi.fn();
  for (const page of pages) listTasks.mockResolvedValueOnce(page);
  return {
    listTasks,
    listTasksByFilter: vi.fn(),
    getTask: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    move: vi.fn(),
    close: vi.fn(),
    delete: vi.fn(),
  };
};

describe("CountUnfinishedTasksUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new CountUnfinishedTasksUseCase(
      buildGateway([{ tasks: [], nextCursor: null }]),
      buildTokenStore(null),
    );

    await expect(useCase.execute()).rejects.toThrow(InvalidTaskSessionError);
  });

  it("walks every page until nextCursor is null and sums their tasks", async () => {
    const gateway = buildGateway([
      { tasks: [{} as Task, {} as Task], nextCursor: "page-2" },
      { tasks: [{} as Task], nextCursor: null },
    ]);
    const useCase = new CountUnfinishedTasksUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const count = await useCase.execute();

    expect(count).toBe(3);
    expect(gateway.listTasks).toHaveBeenNthCalledWith(
      1,
      "a-valid-token-value-000000000000",
      null,
    );
    expect(gateway.listTasks).toHaveBeenNthCalledWith(
      2,
      "a-valid-token-value-000000000000",
      "page-2",
    );
  });

  it("returns 0 for a single empty page", async () => {
    const useCase = new CountUnfinishedTasksUseCase(
      buildGateway([{ tasks: [], nextCursor: null }]),
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    await expect(useCase.execute()).resolves.toBe(0);
  });
});
