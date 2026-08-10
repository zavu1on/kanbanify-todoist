import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import { InvalidTaskTitleError } from "../../domain/errors/InvalidTaskTitleError";
import { CreateTaskInput } from "../dtos/CreateTaskInput";
import type { ITaskGateway } from "../ports/ITaskGateway";
import { CreateTaskUseCase } from "./CreateTaskUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (): ITaskGateway => ({
  listTasks: vi.fn(),
  getTask: vi.fn(),
  create: vi.fn().mockImplementation((_token, task: Task) => task),
  save: vi.fn(),
  move: vi.fn(),
  close: vi.fn(),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("CreateTaskUseCase", () => {
  it("throws InvalidTaskSessionError when no token is stored", async () => {
    const useCase = new CreateTaskUseCase(
      buildGateway(),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(
        new CreateTaskInput(
          "Write report",
          "",
          "project-1",
          "p4",
          null,
          "none",
          [],
          null,
        ),
      ),
    ).rejects.toThrow(InvalidTaskSessionError);
  });

  it("builds a task from the entity factory and persists it via the gateway", async () => {
    const gateway = buildGateway();
    const useCase = new CreateTaskUseCase(gateway, buildTokenStore(token));

    const result = await useCase.execute(
      new CreateTaskInput(
        "Write report",
        "Quarterly numbers",
        "project-1",
        "p1",
        { date: "2026-08-10", datetime: null },
        "todo",
        ["errand"],
        null,
      ),
    );

    expect(gateway.create).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ id: "" }),
    );
    expect(result.title).toBe("Write report");
    expect(result.rawLabels).toEqual(["errand", "todo"]);
  });

  it("passes parentId through to the entity for a subtask", async () => {
    const gateway = buildGateway();
    const useCase = new CreateTaskUseCase(gateway, buildTokenStore(token));

    const result = await useCase.execute(
      new CreateTaskInput(
        "Sub-step",
        "",
        "project-1",
        "p4",
        null,
        "none",
        [],
        "parent-1",
      ),
    );

    expect(result.parentId).toBe("parent-1");
  });

  it("throws InvalidTaskTitleError for an empty title without calling the gateway", async () => {
    const gateway = buildGateway();
    const useCase = new CreateTaskUseCase(gateway, buildTokenStore(token));

    await expect(
      useCase.execute(
        new CreateTaskInput(
          "   ",
          "",
          "project-1",
          "p4",
          null,
          "none",
          [],
          null,
        ),
      ),
    ).rejects.toThrow(InvalidTaskTitleError);
    expect(gateway.create).not.toHaveBeenCalled();
  });
});
