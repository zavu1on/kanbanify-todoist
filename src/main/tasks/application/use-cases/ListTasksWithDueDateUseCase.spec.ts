import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import { Priority } from "../../domain/value-objects/Priority";
import { TaskDue } from "../../domain/value-objects/TaskDue";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";
import { ListTasksWithDueDateUseCase } from "./ListTasksWithDueDateUseCase";

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
  listTasks: vi.fn(),
  listTasksByFilter: vi.fn().mockResolvedValue(page),
  getTask: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  move: vi.fn(),
  close: vi.fn(),
  delete: vi.fn(),
});

describe("ListTasksWithDueDateUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new ListTasksWithDueDateUseCase(
      buildGateway({ tasks: [], nextCursor: null }),
      buildTokenStore(null),
    );

    await expect(useCase.execute(null)).rejects.toThrow(
      InvalidTaskSessionError,
    );
  });

  it("forwards the token, cursor and the dated-tasks filter query to the gateway", async () => {
    const page: TaskListPage = { tasks: [], nextCursor: "next-cursor" };
    const gateway = buildGateway(page);
    const useCase = new ListTasksWithDueDateUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute("current-cursor");

    expect(gateway.listTasksByFilter).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "current-cursor",
      "!no date & !subtask",
    );
    expect(result).toEqual(page);
  });

  it("sorts tasks by due date — overdue to farthest, undated last", async () => {
    const noDue = buildTask("no-due", null);
    const farthest = buildTask("farthest", TaskDue.of("2026-09-01", null));
    const overdue = buildTask("overdue", TaskDue.of("2026-08-01", null));
    const page: TaskListPage = {
      tasks: [noDue, farthest, overdue],
      nextCursor: null,
    };
    const useCase = new ListTasksWithDueDateUseCase(
      buildGateway(page),
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute(null);

    expect(result.tasks.map((task) => task.id)).toEqual([
      "overdue",
      "farthest",
      "no-due",
    ]);
  });
});
