import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import { UpdateTaskStatusInput } from "../application/dtos/UpdateTaskStatusInput";
import type { CountUnfinishedTasksUseCase } from "../application/use-cases/CountUnfinishedTasksUseCase";
import type { ListTasksUseCase } from "../application/use-cases/ListTasksUseCase";
import type { UpdateTaskStatusUseCase } from "../application/use-cases/UpdateTaskStatusUseCase";
import type { TasksCountResult } from "../domain/contracts/TasksCountResult";
import type { TasksErrorType } from "../domain/contracts/TasksFailure";
import type { TasksListResult } from "../domain/contracts/TasksListResult";
import type { UpdateTaskStatusResult } from "../domain/contracts/UpdateTaskStatusResult";
import { InvalidTaskSessionError } from "../domain/errors/InvalidTaskSessionError";
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
  ) {}

  register(): void {
    ipcMain.handle(
      "tasks:list",
      (_event, cursor: unknown, projectId: unknown): Promise<TasksListResult> =>
        this.list(
          typeof cursor === "string" ? cursor : null,
          typeof projectId === "string" ? projectId : undefined,
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
  }

  private async list(
    cursor: string | null,
    projectId?: string,
  ): Promise<TasksListResult> {
    try {
      const { tasks, nextCursor } = await this.listTasksUseCase.execute(
        cursor,
        projectId,
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
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof TasksError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while loading tasks";
  }
}
