import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import { Priority } from "../../domain/value-objects/Priority";
import { UpdateTaskStatusInput } from "../dtos/UpdateTaskStatusInput";
import type { ITaskGateway } from "../ports/ITaskGateway";
import { UpdateTaskStatusUseCase } from "./UpdateTaskStatusUseCase";

const buildTask = (rawLabels: string[]) =>
  Task.reconstitute({
    id: "task-1",
    title: "Write report",
    description: "",
    projectId: "project-1",
    priority: Priority.fromApiValue(4),
    due: null,
    rawLabels,
    checked: false,
  });

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (task: Task): ITaskGateway => ({
  listTasks: vi.fn(),
  getTask: vi.fn().mockResolvedValue(task),
  create: vi.fn(),
  save: vi.fn().mockImplementation((_token, saved: Task) => saved),
  move: vi.fn(),
  close: vi.fn(),
  delete: vi.fn(),
});

describe("UpdateTaskStatusUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new UpdateTaskStatusUseCase(
      buildGateway(buildTask([])),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new UpdateTaskStatusInput("task-1", "in-progress")),
    ).rejects.toThrow(InvalidTaskSessionError);
  });

  it("loads the task, applies the status change on the entity, and persists it", async () => {
    const task = buildTask(["errand", "todo"]);
    const gateway = buildGateway(task);
    const useCase = new UpdateTaskStatusUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute(
      new UpdateTaskStatusInput("task-1", "completed"),
    );

    expect(gateway.getTask).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "task-1",
    );
    expect(gateway.save).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      task,
    );
    expect(result.kanbanStatus.level).toBe("completed");
    expect(result.rawLabels).toEqual(["errand", "completed"]);
  });
});
