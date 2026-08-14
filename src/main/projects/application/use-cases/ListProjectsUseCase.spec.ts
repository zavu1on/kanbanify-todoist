import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type {
  ITaskGateway,
  TaskListPage,
} from "../../../tasks/application/ports/ITaskGateway";
import type { Task } from "../../../tasks/domain/entities/Task";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import type { ProjectApiSource } from "../../domain/mappers/ProjectMapper";
import type { IProjectGateway } from "../ports/IProjectGateway";
import { ListProjectsUseCase } from "./ListProjectsUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildProjectGateway = (
  projects: ProjectApiSource[],
): IProjectGateway => ({
  listProjects: vi.fn().mockResolvedValue(projects),
  getProject: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  archive: vi.fn(),
  delete: vi.fn(),
});

const buildTaskGateway = (
  pagesByProjectId: Record<string, TaskListPage[]>,
): ITaskGateway => {
  const listTasks = vi.fn(
    async (
      _accessToken: string,
      cursor: string | null,
      projectId?: string,
    ): Promise<TaskListPage> => {
      const pages = pagesByProjectId[projectId ?? ""] ?? [];
      const pageIndex = cursor === null ? 0 : Number(cursor);
      return pages[pageIndex] ?? { tasks: [], nextCursor: null };
    },
  );
  return {
    listTasks,
    listTasksByFilter: vi.fn(),
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

describe("ListProjectsUseCase", () => {
  it("throws InvalidProjectSessionError when no token is stored", async () => {
    const useCase = new ListProjectsUseCase(
      buildProjectGateway([]),
      buildTaskGateway({}),
      buildTokenStore(null),
    );

    await expect(useCase.execute()).rejects.toThrow(InvalidProjectSessionError);
  });

  it("maps each raw project and counts its active tasks across pages", async () => {
    const projectGateway = buildProjectGateway([
      {
        id: "1",
        name: "Inbox",
        description: "",
        color: "grey",
        parentId: null,
        isInboxProject: true,
        isArchived: false,
      },
      {
        id: "2",
        name: "Work",
        description: "Work stuff",
        color: "blue",
        parentId: null,
        isInboxProject: false,
        isArchived: false,
      },
    ]);
    const taskGateway = buildTaskGateway({
      "1": [{ tasks: [{} as Task], nextCursor: null }],
      "2": [
        { tasks: [{} as Task, {} as Task], nextCursor: "1" },
        { tasks: [{} as Task], nextCursor: null },
      ],
    });
    const useCase = new ListProjectsUseCase(
      projectGateway,
      taskGateway,
      buildTokenStore(token),
    );

    const projects = await useCase.execute();

    // `Project`'s mutable fields are private (see BACKEND_CODE_STYLE_GUIDE.md
    // "Naming и структура кода"), so results are asserted through getters
    // rather than deep-equaled against plain objects.
    expect(projects).toHaveLength(2);
    expect(projects[0]).toMatchObject({
      id: "1",
      name: "Inbox",
      description: "",
      color: "grey",
      parentId: null,
      isInboxProject: true,
      isArchived: false,
      activeTaskCount: 1,
    });
    expect(projects[1]).toMatchObject({
      id: "2",
      name: "Work",
      description: "Work stuff",
      color: "blue",
      parentId: null,
      isInboxProject: false,
      isArchived: false,
      activeTaskCount: 3,
    });
  });

  it("returns an empty list when there are no projects", async () => {
    const useCase = new ListProjectsUseCase(
      buildProjectGateway([]),
      buildTaskGateway({}),
      buildTokenStore(token),
    );

    await expect(useCase.execute()).resolves.toEqual([]);
  });
});
