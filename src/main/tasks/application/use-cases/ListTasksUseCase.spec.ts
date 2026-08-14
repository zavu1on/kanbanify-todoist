import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import { Priority } from "../../domain/value-objects/Priority";
import { TaskDue } from "../../domain/value-objects/TaskDue";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";
import { ListTasksUseCase } from "./ListTasksUseCase";

const buildTask = (id: string, due: TaskDue | null): Task =>
  Task.reconstitute({
    id,
    title: `task-${id}`,
    description: "",
    projectId: "project-1",
    priority: Priority.fromApiValue(4),
    due,
    rawLabels: [],
    checked: false,
    parentId: null,
  });

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (page: TaskListPage): ITaskGateway => ({
  listTasks: vi.fn().mockResolvedValue(page),
  listTasksByFilter: vi.fn(),
  listTasksCompletedToday: vi.fn(),
  getTask: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  move: vi.fn(),
  close: vi.fn(),
  delete: vi.fn(),
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
      undefined,
      undefined,
    );
    expect(result).toEqual(page);
  });

  it("forwards an optional projectId to scope the list to one project", async () => {
    const page: TaskListPage = { tasks: [], nextCursor: null };
    const gateway = buildGateway(page);
    const useCase = new ListTasksUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    await useCase.execute(null, "project-1");

    expect(gateway.listTasks).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      null,
      "project-1",
      undefined,
    );
  });

  it("hides subtasks from a plain list (no parentId given)", async () => {
    const topLevel = buildTask("top-level", null);
    const subtask = Task.reconstitute({
      id: "sub-1",
      title: "sub-1",
      description: "",
      projectId: "project-1",
      priority: Priority.fromApiValue(4),
      due: null,
      rawLabels: [],
      checked: false,
      parentId: "top-level",
    });
    const page: TaskListPage = {
      tasks: [topLevel, subtask],
      nextCursor: null,
    };
    const useCase = new ListTasksUseCase(
      buildGateway(page),
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute(null);

    expect(result.tasks.map((task) => task.id)).toEqual(["top-level"]);
  });

  it("forwards parentId to the gateway and keeps its subtasks unfiltered", async () => {
    const subtask = Task.reconstitute({
      id: "sub-1",
      title: "sub-1",
      description: "",
      projectId: "project-1",
      priority: Priority.fromApiValue(4),
      due: null,
      rawLabels: [],
      checked: false,
      parentId: "top-level",
    });
    const page: TaskListPage = { tasks: [subtask], nextCursor: null };
    const gateway = buildGateway(page);
    const useCase = new ListTasksUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute(null, undefined, "top-level");

    expect(gateway.listTasks).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      null,
      undefined,
      "top-level",
    );
    expect(result.tasks.map((task) => task.id)).toEqual(["sub-1"]);
  });

  it("sorts tasks by due date — overdue to farthest, undated last", async () => {
    const noDue = buildTask("no-due", null);
    const farthest = buildTask("farthest", TaskDue.of("2026-09-01", null));
    const overdue = buildTask("overdue", TaskDue.of("2026-08-01", null));
    const withTime = buildTask(
      "with-time",
      TaskDue.of("2026-08-10", "2026-08-10T09:00:00Z"),
    );
    const page: TaskListPage = {
      tasks: [noDue, farthest, withTime, overdue],
      nextCursor: null,
    };
    const useCase = new ListTasksUseCase(
      buildGateway(page),
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute(null);

    expect(result.tasks.map((task) => task.id)).toEqual([
      "overdue",
      "with-time",
      "farthest",
      "no-due",
    ]);
  });
});
