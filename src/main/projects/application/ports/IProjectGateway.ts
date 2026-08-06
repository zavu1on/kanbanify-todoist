import type { Project } from "../../domain/entities/Project";
import type { ProjectApiSource } from "../../domain/mappers/ProjectMapper";

export interface IProjectGateway {
  /** Raw project data only, not the domain `Project` — `activeTaskCount` is
   * cross-module (see `ProjectMapper`), so mapping to the full entity happens
   * in `ListProjectsUseCase`, not here.
   * @throws {import("../../domain/errors/ProjectsError").ProjectsError} */
  listProjects(accessToken: string): Promise<ProjectApiSource[]>;

  /** @throws {import("../../domain/errors/ProjectNotFoundError").ProjectNotFoundError} on a 404
   * @throws {import("../../domain/errors/ProjectsError").ProjectsError} otherwise */
  getProject(accessToken: string, id: string): Promise<ProjectApiSource>;

  /** `project.id` is ignored — Todoist assigns the real id (see `Project.create`).
   * @throws {import("../../domain/errors/ProjectsError").ProjectsError} */
  create(accessToken: string, project: Project): Promise<ProjectApiSource>;

  /** Persists name/description/color changes — the specific fields a project
   * exposes for editing (see `Project.updateDetails`).
   * @throws {import("../../domain/errors/ProjectsError").ProjectsError} */
  save(accessToken: string, project: Project): Promise<ProjectApiSource>;

  /** @throws {import("../../domain/errors/ProjectsError").ProjectsError} */
  archive(accessToken: string, id: string): Promise<void>;

  /** @throws {import("../../domain/errors/ProjectsError").ProjectsError} */
  delete(accessToken: string, id: string): Promise<void>;
}
