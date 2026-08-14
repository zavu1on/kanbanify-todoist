import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";
import { CountTasksCompletedTodayUseCase } from "./CountTasksCompletedTodayUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (pages: TaskListPage[]): ITaskGateway => {
  const listTasksCompletedToday = vi.fn();
  for (const page of pages) listTasksCompletedToday.mockResolvedValueOnce(page);
  return {
    listTasks: vi.fn(),
    listTasksByFilter: vi.fn(),
    listTasksCompletedToday,
    getTask: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    move: vi.fn(),
    close: vi.fn(),
    delete: vi.fn(),
  };
};

describe("CountTasksCompletedTodayUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new CountTasksCompletedTodayUseCase(
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
    const useCase = new CountTasksCompletedTodayUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    await expect(useCase.execute()).resolves.toBe(3);
    expect(gateway.listTasksCompletedToday).toHaveBeenNthCalledWith(
      1,
      "a-valid-token-value-000000000000",
      null,
    );
    expect(gateway.listTasksCompletedToday).toHaveBeenNthCalledWith(
      2,
      "a-valid-token-value-000000000000",
      "page-2",
    );
  });
});
