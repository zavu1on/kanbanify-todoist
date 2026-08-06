import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import type { ListProjectsUseCase } from "../application/use-cases/ListProjectsUseCase";
import type { ProjectsErrorType } from "../domain/contracts/ProjectsFailure";
import type { ProjectsListResult } from "../domain/contracts/ProjectsListResult";
import { InvalidProjectSessionError } from "../domain/errors/InvalidProjectSessionError";
import { ProjectsError } from "../domain/errors/ProjectsError";
import { TodoistProjectsConnectionError } from "../domain/errors/TodoistProjectsConnectionError";

export class ProjectsIpcController implements IpcController {
  constructor(private readonly listProjectsUseCase: ListProjectsUseCase) {}

  register(): void {
    ipcMain.handle(
      "projects:list",
      (): Promise<ProjectsListResult> => this.list(),
    );
  }

  private async list(): Promise<ProjectsListResult> {
    try {
      const projects = await this.listProjectsUseCase.execute();
      return { ok: true, projects };
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

  private getErrorType(error: unknown): ProjectsErrorType {
    if (error instanceof InvalidProjectSessionError) return "auth_error";
    if (error instanceof TodoistProjectsConnectionError) return "network_error";
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof ProjectsError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while loading projects";
  }
}
