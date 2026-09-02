import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import { InvalidTaskSessionError } from "../../tasks/domain/errors/InvalidTaskSessionError";
import { TasksError } from "../../tasks/domain/errors/TasksError";
import { TodoistTasksConnectionError } from "../../tasks/domain/errors/TodoistTasksConnectionError";
import { TaskMapper } from "../../tasks/domain/mappers/TaskMapper";
import { CreateFilterInput } from "../application/dtos/CreateFilterInput";
import { UpdateFilterInput } from "../application/dtos/UpdateFilterInput";
import type { CreateFilterUseCase } from "../application/use-cases/CreateFilterUseCase";
import type { DeleteFilterUseCase } from "../application/use-cases/DeleteFilterUseCase";
import type { ListFiltersUseCase } from "../application/use-cases/ListFiltersUseCase";
import type { ListFilterTasksUseCase } from "../application/use-cases/ListFilterTasksUseCase";
import type { UpdateFilterUseCase } from "../application/use-cases/UpdateFilterUseCase";
import type { CreateFilterRequest } from "../domain/contracts/CreateFilterRequest";
import type { CreateFilterResult } from "../domain/contracts/CreateFilterResult";
import type { DeleteFilterResult } from "../domain/contracts/DeleteFilterResult";
import type { FiltersErrorType } from "../domain/contracts/FiltersFailure";
import type { FiltersListResult } from "../domain/contracts/FiltersListResult";
import type { FilterTasksResult } from "../domain/contracts/FilterTasksResult";
import type { UpdateFilterRequest } from "../domain/contracts/UpdateFilterRequest";
import type { UpdateFilterResult } from "../domain/contracts/UpdateFilterResult";
import { FilterNotFoundError } from "../domain/errors/FilterNotFoundError";
import { FiltersError } from "../domain/errors/FiltersError";
import { InvalidFilterSessionError } from "../domain/errors/InvalidFilterSessionError";
import { InvalidFilterTitleError } from "../domain/errors/InvalidFilterTitleError";
import { FilterMapper } from "../domain/mappers/FilterMapper";

export class FiltersIpcController implements IpcController {
  private readonly filterMapper = new FilterMapper();
  private readonly taskMapper = new TaskMapper();

  constructor(
    private readonly listFiltersUseCase: ListFiltersUseCase,
    private readonly createFilterUseCase: CreateFilterUseCase,
    private readonly updateFilterUseCase: UpdateFilterUseCase,
    private readonly deleteFilterUseCase: DeleteFilterUseCase,
    private readonly listFilterTasksUseCase: ListFilterTasksUseCase,
  ) {}

  register(): void {
    ipcMain.handle(
      "filters:list",
      (): Promise<FiltersListResult> => this.list(),
    );
    ipcMain.handle(
      "filters:create",
      (_event, input: CreateFilterRequest): Promise<CreateFilterResult> =>
        this.create(input),
    );
    ipcMain.handle(
      "filters:update",
      (
        _event,
        id: unknown,
        input: UpdateFilterRequest,
      ): Promise<UpdateFilterResult> =>
        typeof id === "number"
          ? this.update(id, input)
          : Promise.resolve({
              ok: false,
              error: {
                type: "unknown",
                message: "Invalid filter update request",
              },
            }),
    );
    ipcMain.handle(
      "filters:delete",
      (_event, id: unknown): Promise<DeleteFilterResult> =>
        typeof id === "number"
          ? this.delete(id)
          : Promise.resolve({
              ok: false,
              error: {
                type: "unknown",
                message: "Invalid filter delete request",
              },
            }),
    );
    ipcMain.handle(
      "filters:tasks",
      (
        _event,
        filterId: unknown,
        cursor: unknown,
      ): Promise<FilterTasksResult> =>
        typeof filterId === "number"
          ? this.tasks(filterId, typeof cursor === "string" ? cursor : null)
          : Promise.resolve({
              ok: false,
              error: {
                type: "unknown",
                message: "Invalid filter tasks request",
              },
            }),
    );
  }

  private async list(): Promise<FiltersListResult> {
    try {
      const filters = await this.listFiltersUseCase.execute();
      return {
        ok: true,
        filters: filters.map((filter) => this.filterMapper.toDTO(filter)),
      };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async create(
    input: CreateFilterRequest,
  ): Promise<CreateFilterResult> {
    try {
      const filter = await this.createFilterUseCase.execute(
        new CreateFilterInput(input.title, input.color, input.query),
      );
      return { ok: true, filter: this.filterMapper.toDTO(filter) };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async update(
    id: number,
    input: UpdateFilterRequest,
  ): Promise<UpdateFilterResult> {
    try {
      const filter = await this.updateFilterUseCase.execute(
        new UpdateFilterInput(id, input.title, input.color, input.query),
      );
      return { ok: true, filter: this.filterMapper.toDTO(filter) };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async delete(id: number): Promise<DeleteFilterResult> {
    try {
      await this.deleteFilterUseCase.execute(id);
      return { ok: true };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async tasks(
    filterId: number,
    cursor: string | null,
  ): Promise<FilterTasksResult> {
    try {
      const { tasks, nextCursor } = await this.listFilterTasksUseCase.execute(
        filterId,
        cursor,
      );
      return {
        ok: true,
        tasks: tasks.map((task) => this.taskMapper.toDTO(task)),
        nextCursor,
      };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private toFailure(error: unknown): {
    ok: false;
    error: { type: FiltersErrorType; message: string };
  } {
    return {
      ok: false,
      error: {
        type: this.getErrorType(error),
        message: this.getMessageFromError(error),
      },
    };
  }

  // `filters:tasks` runs through the `tasks` module's own gateway (see
  // `ListFilterTasksUseCase`), so its failures surface as `TasksError`
  // subclasses, not `FiltersError` ones — both families are recognized here
  // since this is the one handler that can throw either.
  private getErrorType(error: unknown): FiltersErrorType {
    if (error instanceof InvalidFilterSessionError) return "auth_error";
    if (error instanceof InvalidTaskSessionError) return "auth_error";
    if (error instanceof TodoistTasksConnectionError) return "network_error";
    if (error instanceof FilterNotFoundError) return "not_found";
    if (error instanceof InvalidFilterTitleError) return "invalid_title";
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof FiltersError) return error.message;
    if (error instanceof TasksError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while loading filters";
  }
}
