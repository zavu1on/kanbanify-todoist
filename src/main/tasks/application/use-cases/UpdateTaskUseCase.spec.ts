import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import { Priority } from "../../domain/value-objects/Priority";
import { UpdateTaskInput } from "../dtos/UpdateTaskInput";
import type { ITaskGateway } from "../ports/ITaskGateway";
import { UpdateTaskUseCase } from "./UpdateTaskUseCase";

const buildTask = (projectId: string, parentId: string | null = null) =>
  Task.reconstitute({
    id: "task-1",
    title: "Write report",
    description: "",
    projectId,
    priority: Priority.fromApiValue(4),
    due: null,
    rawLabels: ["errand", "todo"],
    checked: false,
    parentId,
  });

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (task: Task): ITaskGateway => ({
  listTasks: vi.fn(),
  listTasksByFilter: vi.fn(),
  listTasksCompletedToday: vi.fn(),
  getTask: vi.fn().mockResolvedValue(task),
  create: vi.fn(),
  save: vi.fn().mockImplementation((_token, saved: Task) => saved),
  move: vi.fn().mockImplementation((_token, _taskId, projectId: string) => {
    task.moveToProject(projectId);
    return task;
  }),
  close: vi.fn(),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("UpdateTaskUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new UpdateTaskUseCase(
      buildGateway(buildTask("project-1")),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(
        new UpdateTaskInput(
          "task-1",
          "Write report",
          "",
          "project-1",
          "p4",
          null,
          "todo",
          [],
        ),
      ),
    ).rejects.toThrow(InvalidTaskSessionError);
  });

  it("loads the task, applies field updates and status, and saves via the gateway", async () => {
    const task = buildTask("project-1");
    const gateway = buildGateway(task);
    const useCase = new UpdateTaskUseCase(gateway, buildTokenStore(token));

    const result = await useCase.execute(
      new UpdateTaskInput(
        "task-1",
        "Write final report",
        "Updated",
        "project-1",
        "p1",
        { date: "2026-09-01", datetime: null },
        "completed",
        ["errand", "urgent"],
      ),
    );

    expect(gateway.save).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      task,
    );
    expect(gateway.move).not.toHaveBeenCalled();
    expect(result.title).toBe("Write final report");
    expect(result.kanbanStatus.level).toBe("completed");
  });

  it("moves the task via the gateway only when projectId changed", async () => {
    const task = buildTask("project-1");
    const gateway = buildGateway(task);
    const useCase = new UpdateTaskUseCase(gateway, buildTokenStore(token));

    await useCase.execute(
      new UpdateTaskInput(
        "task-1",
        "Write report",
        "",
        "project-2",
        "p4",
        null,
        "todo",
        ["errand"],
      ),
    );

    expect(gateway.move).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "task-1",
      "project-2",
    );
  });

  it("never moves a subtask, even when the input's projectId differs from its own", async () => {
    // Todoist's move command accepts exactly one of project/section/parent —
    // moving a subtask by project alone would silently detach it from its
    // parent (see the use-case's comment), so a subtask's project stays
    // whatever the parent gave it regardless of what the caller sends.
    const task = buildTask("project-1", "parent-1");
    const gateway = buildGateway(task);
    const useCase = new UpdateTaskUseCase(gateway, buildTokenStore(token));

    const result = await useCase.execute(
      new UpdateTaskInput(
        "task-1",
        "Write report",
        "",
        "project-2",
        "p4",
        null,
        "todo",
        ["errand"],
      ),
    );

    expect(gateway.move).not.toHaveBeenCalled();
    expect(result.projectId).toBe("project-1");
    expect(result.parentId).toBe("parent-1");
  });
});
