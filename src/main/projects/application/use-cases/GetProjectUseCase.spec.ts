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
import { GetProjectUseCase } from "./GetProjectUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildProjectGateway = (raw: ProjectApiSource): IProjectGateway => ({
  listProjects: vi.fn(),
  getProject: vi.fn().mockResolvedValue(raw),
  create: vi.fn(),
  save: vi.fn(),
  archive: vi.fn(),
  delete: vi.fn(),
});

const buildTaskGateway = (pages: TaskListPage[]): ITaskGateway => ({
  listTasks: vi.fn(async (_accessToken, cursor: string | null) => {
    const pageIndex = cursor === null ? 0 : Number(cursor);
    return pages[pageIndex] ?? { tasks: [], nextCursor: null };
  }),
  listTasksByFilter: vi.fn(),
  listTasksCompletedToday: vi.fn(),
  getTask: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  move: vi.fn(),
  close: vi.fn(),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

const regularRaw: ProjectApiSource = {
  id: "1",
  name: "Work",
  description: "Work stuff",
  color: "blue",
  parentId: null,
  isInboxProject: false,
  isArchived: false,
};

describe("GetProjectUseCase", () => {
  it("throws InvalidProjectSessionError when no token is stored", async () => {
    const useCase = new GetProjectUseCase(
      buildProjectGateway(regularRaw),
      buildTaskGateway([]),
      buildTokenStore(null),
    );

    await expect(useCase.execute("1")).rejects.toThrow(
      InvalidProjectSessionError,
    );
  });

  it("loads the project and counts its active tasks across pages", async () => {
    const projectGateway = buildProjectGateway(regularRaw);
    const taskGateway = buildTaskGateway([
      { tasks: [{} as Task, {} as Task], nextCursor: "1" },
      { tasks: [{} as Task], nextCursor: null },
    ]);
    const useCase = new GetProjectUseCase(
      projectGateway,
      taskGateway,
      buildTokenStore(token),
    );

    const project = await useCase.execute("1");

    expect(projectGateway.getProject).toHaveBeenCalledWith(token.value, "1");
    expect(project).toMatchObject({
      id: "1",
      name: "Work",
      description: "Work stuff",
      color: "blue",
      parentId: null,
      isInboxProject: false,
      isArchived: false,
      activeTaskCount: 3,
    });
  });
});
