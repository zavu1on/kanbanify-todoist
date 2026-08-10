import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import { CompleteTaskInput } from "../application/dtos/CompleteTaskInput";
import { CreateTaskInput } from "../application/dtos/CreateTaskInput";
import { UpdateTaskInput } from "../application/dtos/UpdateTaskInput";
import { UpdateTaskStatusInput } from "../application/dtos/UpdateTaskStatusInput";
import type { CompleteTaskUseCase } from "../application/use-cases/CompleteTaskUseCase";
import type { CountUnfinishedTasksUseCase } from "../application/use-cases/CountUnfinishedTasksUseCase";
import type { CreateTaskUseCase } from "../application/use-cases/CreateTaskUseCase";
import type { DeleteTaskUseCase } from "../application/use-cases/DeleteTaskUseCase";
import type { ListTasksUseCase } from "../application/use-cases/ListTasksUseCase";
import type { UpdateTaskStatusUseCase } from "../application/use-cases/UpdateTaskStatusUseCase";
import type { UpdateTaskUseCase } from "../application/use-cases/UpdateTaskUseCase";
import type { CompleteTaskResult } from "../domain/contracts/CompleteTaskResult";
import type { CreateTaskRequest } from "../domain/contracts/CreateTaskRequest";
import type { CreateTaskResult } from "../domain/contracts/CreateTaskResult";
import type { DeleteTaskResult } from "../domain/contracts/DeleteTaskResult";
import type { TasksCountResult } from "../domain/contracts/TasksCountResult";
import type { TasksErrorType } from "../domain/contracts/TasksFailure";
import type { TasksListResult } from "../domain/contracts/TasksListResult";
import type { UpdateTaskRequest } from "../domain/contracts/UpdateTaskRequest";
import type { UpdateTaskResult } from "../domain/contracts/UpdateTaskResult";
import type { UpdateTaskStatusResult } from "../domain/contracts/UpdateTaskStatusResult";
import { InvalidTaskSessionError } from "../domain/errors/InvalidTaskSessionError";
import { InvalidTaskTitleError } from "../domain/errors/InvalidTaskTitleError";
import { TaskAlreadyCompletedError } from "../domain/errors/TaskAlreadyCompletedError";
import { TasksError } from "../domain/errors/TasksError";
import { TodoistTasksConnectionError } from "../domain/errors/TodoistTasksConnectionError";
import { TaskMapper } from "../domain/mappers/TaskMapper";
import { KanbanStatus } from "../domain/value-objects/KanbanStatus";

export class TasksIpcController implements IpcController {
  private readonly taskMapper = new TaskMapper();

  constructor(
    private readonly listTasksUseCase: ListTasksUseCase,
    private readonly updateTaskStatusUseCase: UpdateTaskStatusUseCase,
    private readonly countUnfinishedTasksUseCase: CountUnfinishedTasksUseCase,
    private readonly completeTaskUseCase: CompleteTaskUseCase,
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
  ) {}

  register(): void {
    ipcMain.handle(
      "tasks:list",
      (
        _event,
        cursor: unknown,
        projectId: unknown,
        parentId: unknown,
      ): Promise<TasksListResult> =>
        this.list(
          typeof cursor === "string" ? cursor : null,
          typeof projectId === "string" ? projectId : undefined,
          typeof parentId === "string" ? parentId : undefined,
        ),
    );
    ipcMain.handle(
      "tasks:updateStatus",
      (
        _event,
        taskId: unknown,
        status: unknown,
      ): Promise<UpdateTaskStatusResult> => this.updateStatus(taskId, status),
    );
    ipcMain.handle(
      "tasks:count",
      (): Promise<TasksCountResult> => this.count(),
    );
    ipcMain.handle(
      "tasks:complete",
      (_event, taskId: unknown): Promise<CompleteTaskResult> =>
        this.complete(taskId),
    );
    ipcMain.handle(
      "tasks:create",
      (_event, input: CreateTaskRequest): Promise<CreateTaskResult> =>
        this.create(input),
    );
    ipcMain.handle(
      "tasks:update",
      (
        _event,
        taskId: unknown,
        input: UpdateTaskRequest,
      ): Promise<UpdateTaskResult> => this.update(taskId, input),
    );
    ipcMain.handle(
      "tasks:delete",
      (_event, taskId: unknown): Promise<DeleteTaskResult> =>
        this.delete(taskId),
    );
  }

  private async list(
    cursor: string | null,
    projectId?: string,
    parentId?: string,
  ): Promise<TasksListResult> {
    try {
      const { tasks, nextCursor } = await this.listTasksUseCase.execute(
        cursor,
        projectId,
        parentId,
      );
      return {
        ok: true,
        tasks: tasks.map((task) => this.taskMapper.toDTO(task)),
        nextCursor,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async updateStatus(
    taskId: unknown,
    status: unknown,
  ): Promise<UpdateTaskStatusResult> {
    if (
      typeof taskId !== "string" ||
      !KanbanStatus.isKanbanStatusLevel(status)
    ) {
      return {
        ok: false,
        error: {
          type: "unknown",
          message: "Invalid task status update request",
        },
      };
    }

    try {
      const task = await this.updateTaskStatusUseCase.execute(
        new UpdateTaskStatusInput(taskId, status),
      );
      return { ok: true, task: this.taskMapper.toDTO(task) };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async complete(taskId: unknown): Promise<CompleteTaskResult> {
    if (typeof taskId !== "string") {
      return {
        ok: false,
        error: { type: "unknown", message: "Invalid task complete request" },
      };
    }

    try {
      await this.completeTaskUseCase.execute(new CompleteTaskInput(taskId));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async create(input: CreateTaskRequest): Promise<CreateTaskResult> {
    try {
      const task = await this.createTaskUseCase.execute(
        new CreateTaskInput(
          input.title,
          input.description,
          input.projectId,
          input.priority,
          input.due,
          input.kanbanStatus,
          input.labels,
          input.parentId,
        ),
      );
      return { ok: true, task: this.taskMapper.toDTO(task) };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async update(
    taskId: unknown,
    input: UpdateTaskRequest,
  ): Promise<UpdateTaskResult> {
    if (typeof taskId !== "string") {
      return {
        ok: false,
        error: { type: "unknown", message: "Invalid task update request" },
      };
    }

    try {
      const task = await this.updateTaskUseCase.execute(
        new UpdateTaskInput(
          taskId,
          input.title,
          input.description,
          input.projectId,
          input.priority,
          input.due,
          input.kanbanStatus,
          input.labels,
        ),
      );
      return { ok: true, task: this.taskMapper.toDTO(task) };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async delete(taskId: unknown): Promise<DeleteTaskResult> {
    if (typeof taskId !== "string") {
      return {
        ok: false,
        error: { type: "unknown", message: "Invalid task delete request" },
      };
    }

    try {
      await this.deleteTaskUseCase.execute(taskId);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async count(): Promise<TasksCountResult> {
    try {
      const count = await this.countUnfinishedTasksUseCase.execute();
      return { ok: true, count };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private getErrorType(error: unknown): TasksErrorType {
    if (error instanceof InvalidTaskSessionError) return "auth_error";
    if (error instanceof TodoistTasksConnectionError) return "network_error";
    if (error instanceof TaskAlreadyCompletedError) return "already_completed";
    if (error instanceof InvalidTaskTitleError) return "invalid_title";
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof TasksError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while loading tasks";
  }
}
