import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type {
  ITaskGateway,
  TaskListPage,
} from "../../../tasks/application/ports/ITaskGateway";
import type { Task } from "../../../tasks/domain/entities/Task";
import { Filter } from "../../domain/entities/Filter";
import { InvalidFilterSessionError } from "../../domain/errors/InvalidFilterSessionError";
import type { IFilterStore } from "../ports/IFilterStore";
import { ListFiltersUseCase } from "./ListFiltersUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildFilterStore = (filters: Filter[]): IFilterStore => ({
  list: vi.fn().mockResolvedValue(filters),
  get: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const buildTaskGateway = (
  pagesByQuery: Record<string, TaskListPage[]>,
): ITaskGateway => {
  const listTasksByFilter = vi.fn(
    async (
      _accessToken: string,
      cursor: string | null,
      query: string,
    ): Promise<TaskListPage> => {
      const pages = pagesByQuery[query] ?? [];
      const pageIndex = cursor === null ? 0 : Number(cursor);
      return pages[pageIndex] ?? { tasks: [], nextCursor: null };
    },
  );
  return {
    listTasks: vi.fn(),
    listTasksByFilter,
    listTasksCompletedToday: vi.fn(),
    getTask: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    move: vi.fn(),
    close: vi.fn(),
    delete: vi.fn(),
  };
};

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("ListFiltersUseCase", () => {
  it("throws InvalidFilterSessionError when no token is stored", async () => {
    const useCase = new ListFiltersUseCase(
      buildFilterStore([]),
      buildTaskGateway({}),
      buildTokenStore(null),
    );

    await expect(useCase.execute()).rejects.toThrow(InvalidFilterSessionError);
  });

  it("pairs each filter with its matching task count across pages", async () => {
    const filters = [
      Filter.reconstitute({
        id: 1,
        title: "Urgent",
        color: "red",
        query: "p1",
      }),
      Filter.reconstitute({
        id: 2,
        title: "Work",
        color: "blue",
        query: "#Work",
      }),
    ];
    const filterStore = buildFilterStore(filters);
    const taskGateway = buildTaskGateway({
      p1: [{ tasks: [{ parentId: null } as Task], nextCursor: null }],
      "#Work": [
        {
          tasks: [{ parentId: null } as Task, { parentId: null } as Task],
          nextCursor: "1",
        },
        { tasks: [{ parentId: null } as Task], nextCursor: null },
      ],
    });
    const useCase = new ListFiltersUseCase(
      filterStore,
      taskGateway,
      buildTokenStore(token),
    );

    const result = await useCase.execute();

    expect(result).toEqual([
      { filter: filters[0], taskCount: 1 },
      { filter: filters[1], taskCount: 3 },
    ]);
  });

  it("excludes subtasks from the count", async () => {
    const filters = [
      Filter.reconstitute({
        id: 1,
        title: "Work",
        color: "blue",
        query: "#Work",
      }),
    ];
    const filterStore = buildFilterStore(filters);
    const taskGateway = buildTaskGateway({
      "#Work": [
        {
          tasks: [{ parentId: null } as Task, { parentId: "parent-1" } as Task],
          nextCursor: null,
        },
      ],
    });
    const useCase = new ListFiltersUseCase(
      filterStore,
      taskGateway,
      buildTokenStore(token),
    );

    const result = await useCase.execute();

    expect(result).toEqual([{ filter: filters[0], taskCount: 1 }]);
  });

  it("returns an empty list when there are no filters", async () => {
    const useCase = new ListFiltersUseCase(
      buildFilterStore([]),
      buildTaskGateway({}),
      buildTokenStore(token),
    );

    await expect(useCase.execute()).resolves.toEqual([]);
  });
});
