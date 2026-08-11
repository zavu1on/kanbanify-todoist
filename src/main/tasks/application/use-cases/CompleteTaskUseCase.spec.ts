import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import { TaskAlreadyCompletedError } from "../../domain/errors/TaskAlreadyCompletedError";
import { Priority } from "../../domain/value-objects/Priority";
import { CompleteTaskInput } from "../dtos/CompleteTaskInput";
import type { ITaskGateway } from "../ports/ITaskGateway";
import { CompleteTaskUseCase } from "./CompleteTaskUseCase";

const buildTask = (checked = false) =>
  Task.reconstitute({
    id: "task-1",
    title: "Write report",
    description: "",
    projectId: "project-1",
    priority: Priority.fromApiValue(4),
    due: null,
    rawLabels: ["errand", "todo"],
    checked,
    parentId: null,
  });

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (task: Task): ITaskGateway => ({
  listTasks: vi.fn(),
  listTasksByFilter: vi.fn(),
  getTask: vi.fn().mockResolvedValue(task),
  create: vi.fn(),
  save: vi.fn(),
  move: vi.fn(),
  close: vi.fn(),
  delete: vi.fn(),
});

describe("CompleteTaskUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new CompleteTaskUseCase(
      buildGateway(buildTask()),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new CompleteTaskInput("task-1")),
    ).rejects.toThrow(InvalidTaskSessionError);
  });

  it("loads the task, marks it completed on the entity, and closes it via the gateway", async () => {
    const task = buildTask();
    const gateway = buildGateway(task);
    const useCase = new CompleteTaskUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    await useCase.execute(new CompleteTaskInput("task-1"));

    expect(gateway.getTask).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "task-1",
    );
    expect(task.checked).toBe(true);
    expect(gateway.close).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "task-1",
    );
  });

  it("throws TaskAlreadyCompletedError and does not call the gateway when the task is already checked", async () => {
    const task = buildTask(true);
    const gateway = buildGateway(task);
    const useCase = new CompleteTaskUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    await expect(
      useCase.execute(new CompleteTaskInput("task-1")),
    ).rejects.toThrow(TaskAlreadyCompletedError);
    expect(gateway.close).not.toHaveBeenCalled();
  });
});
