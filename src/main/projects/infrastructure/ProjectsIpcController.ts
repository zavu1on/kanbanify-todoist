import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import { CreateProjectInput } from "../application/dtos/CreateProjectInput";
import { UpdateProjectInput } from "../application/dtos/UpdateProjectInput";
import type { ArchiveProjectUseCase } from "../application/use-cases/ArchiveProjectUseCase";
import type { CreateProjectUseCase } from "../application/use-cases/CreateProjectUseCase";
import type { DeleteProjectUseCase } from "../application/use-cases/DeleteProjectUseCase";
import type { GetProjectUseCase } from "../application/use-cases/GetProjectUseCase";
import type { ListProjectsUseCase } from "../application/use-cases/ListProjectsUseCase";
import type { UpdateProjectUseCase } from "../application/use-cases/UpdateProjectUseCase";
import type { ArchiveProjectResult } from "../domain/contracts/ArchiveProjectResult";
import type { CreateProjectRequest } from "../domain/contracts/CreateProjectRequest";
import type { CreateProjectResult } from "../domain/contracts/CreateProjectResult";
import type { DeleteProjectResult } from "../domain/contracts/DeleteProjectResult";
import type { GetProjectResult } from "../domain/contracts/GetProjectResult";
import type { ProjectsErrorType } from "../domain/contracts/ProjectsFailure";
import type { ProjectsListResult } from "../domain/contracts/ProjectsListResult";
import type { UpdateProjectRequest } from "../domain/contracts/UpdateProjectRequest";
import type { UpdateProjectResult } from "../domain/contracts/UpdateProjectResult";
import { InboxProjectProtectedError } from "../domain/errors/InboxProjectProtectedError";
import { InvalidProjectNameError } from "../domain/errors/InvalidProjectNameError";
import { InvalidProjectSessionError } from "../domain/errors/InvalidProjectSessionError";
import { ProjectNotFoundError } from "../domain/errors/ProjectNotFoundError";
import { ProjectsError } from "../domain/errors/ProjectsError";
import { TodoistProjectsConnectionError } from "../domain/errors/TodoistProjectsConnectionError";
import { ProjectMapper } from "../domain/mappers/ProjectMapper";

export class ProjectsIpcController implements IpcController {
  private readonly projectMapper = new ProjectMapper();

  constructor(
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly archiveProjectUseCase: ArchiveProjectUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
  ) {}

  register(): void {
    ipcMain.handle(
      "projects:list",
      (): Promise<ProjectsListResult> => this.list(),
    );
    ipcMain.handle(
      "projects:get",
      (_event, id: string): Promise<GetProjectResult> => this.get(id),
    );
    ipcMain.handle(
      "projects:create",
      (_event, input: CreateProjectRequest): Promise<CreateProjectResult> =>
        this.create(input),
    );
    ipcMain.handle(
      "projects:update",
      (
        _event,
        id: string,
        input: UpdateProjectRequest,
      ): Promise<UpdateProjectResult> => this.update(id, input),
    );
    ipcMain.handle(
      "projects:archive",
      (_event, id: string): Promise<ArchiveProjectResult> => this.archive(id),
    );
    ipcMain.handle(
      "projects:delete",
      (_event, id: string): Promise<DeleteProjectResult> => this.delete(id),
    );
  }

  private async list(): Promise<ProjectsListResult> {
    try {
      const projects = await this.listProjectsUseCase.execute();
      return {
        ok: true,
        projects: projects.map((project) => this.projectMapper.toDTO(project)),
      };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async get(id: string): Promise<GetProjectResult> {
    try {
      const project = await this.getProjectUseCase.execute(id);
      return { ok: true, project: this.projectMapper.toDTO(project) };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async create(
    input: CreateProjectRequest,
  ): Promise<CreateProjectResult> {
    try {
      const project = await this.createProjectUseCase.execute(
        new CreateProjectInput(
          input.name,
          input.description,
          input.color,
          input.parentId,
        ),
      );
      return { ok: true, project: this.projectMapper.toDTO(project) };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async update(
    id: string,
    input: UpdateProjectRequest,
  ): Promise<UpdateProjectResult> {
    try {
      const project = await this.updateProjectUseCase.execute(
        new UpdateProjectInput(id, input.name, input.description, input.color),
      );
      return { ok: true, project: this.projectMapper.toDTO(project) };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async archive(id: string): Promise<ArchiveProjectResult> {
    try {
      await this.archiveProjectUseCase.execute(id);
      return { ok: true };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async delete(id: string): Promise<DeleteProjectResult> {
    try {
      await this.deleteProjectUseCase.execute(id);
      return { ok: true };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private toFailure(error: unknown): {
    ok: false;
    error: { type: ProjectsErrorType; message: string };
  } {
    return {
      ok: false,
      error: {
        type: this.getErrorType(error),
        message: this.getMessageFromError(error),
      },
    };
  }

  private getErrorType(error: unknown): ProjectsErrorType {
    if (error instanceof InvalidProjectSessionError) return "auth_error";
    if (error instanceof TodoistProjectsConnectionError) return "network_error";
    if (error instanceof ProjectNotFoundError) return "not_found";
    if (error instanceof InvalidProjectNameError) return "invalid_name";
    if (error instanceof InboxProjectProtectedError) return "inbox_protected";
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof ProjectsError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while loading projects";
  }
}
