import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import { UpdateTaskStatusInput } from "../dtos/UpdateTaskStatusInput";
import type { ITaskGateway } from "../ports/ITaskGateway";
import { UpdateTaskStatusUseCase } from "./UpdateTaskStatusUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (updatedTask: Task): ITaskGateway => ({
  listTasks: vi.fn(),
  updateTaskStatus: vi.fn().mockResolvedValue(updatedTask),
});

describe("UpdateTaskStatusUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new UpdateTaskStatusUseCase(
      buildGateway({} as Task),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new UpdateTaskStatusInput("task-1", "in-progress")),
    ).rejects.toThrow(InvalidTaskSessionError);
  });

  it("forwards the token, task id and status to the gateway and returns the updated task", async () => {
    const updatedTask = {} as Task;
    const gateway = buildGateway(updatedTask);
    const useCase = new UpdateTaskStatusUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute(
      new UpdateTaskStatusInput("task-1", "completed"),
    );

    expect(gateway.updateTaskStatus).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      "task-1",
      "completed",
    );
    expect(result).toBe(updatedTask);
  });
});
