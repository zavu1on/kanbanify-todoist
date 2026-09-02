import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type {
  ITaskGateway,
  TaskListPage,
} from "../../../tasks/application/ports/ITaskGateway";
import { Filter } from "../../domain/entities/Filter";
import { FilterNotFoundError } from "../../domain/errors/FilterNotFoundError";
import { InvalidFilterSessionError } from "../../domain/errors/InvalidFilterSessionError";
import type { IFilterStore } from "../ports/IFilterStore";
import { ListFilterTasksUseCase } from "./ListFilterTasksUseCase";

const token = AccessToken.of("a-valid-token-value-000000000000");

const buildFilterStore = (filter: Filter | null): IFilterStore => ({
  list: vi.fn(),
  get: vi.fn().mockResolvedValue(filter),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildTaskGateway = (page: TaskListPage): ITaskGateway => ({
  listTasks: vi.fn(),
  listTasksByFilter: vi.fn().mockResolvedValue(page),
  listTasksCompletedToday: vi.fn(),
  getTask: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  move: vi.fn(),
  close: vi.fn(),
  delete: vi.fn(),
});

describe("ListFilterTasksUseCase", () => {
  it("throws FilterNotFoundError when the filter doesn't exist", async () => {
    const useCase = new ListFilterTasksUseCase(
      buildFilterStore(null),
      buildTaskGateway({ tasks: [], nextCursor: null }),
      buildTokenStore(token),
    );

    await expect(useCase.execute(999, null)).rejects.toThrow(
      FilterNotFoundError,
    );
  });

  it("throws InvalidFilterSessionError when no token is stored", async () => {
    const filter = Filter.reconstitute({
      id: 1,
      title: "Urgent",
      color: "red",
      query: "p1",
    });
    const useCase = new ListFilterTasksUseCase(
      buildFilterStore(filter),
      buildTaskGateway({ tasks: [], nextCursor: null }),
      buildTokenStore(null),
    );

    await expect(useCase.execute(1, null)).rejects.toThrow(
      InvalidFilterSessionError,
    );
  });

  it("forwards the token, cursor and the stored query to the task gateway", async () => {
    const filter = Filter.reconstitute({
      id: 1,
      title: "Urgent",
      color: "red",
      query: "p1 & #Work",
    });
    const page: TaskListPage = { tasks: [], nextCursor: "next-cursor" };
    const taskGateway = buildTaskGateway(page);
    const useCase = new ListFilterTasksUseCase(
      buildFilterStore(filter),
      taskGateway,
      buildTokenStore(token),
    );

    const result = await useCase.execute(1, "current-cursor");

    expect(taskGateway.listTasksByFilter).toHaveBeenCalledWith(
      token.value,
      "current-cursor",
      "p1 & #Work",
    );
    expect(result).toEqual(page);
  });
});
