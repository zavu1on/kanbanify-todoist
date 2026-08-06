import type { ProjectApiSource } from "../../domain/mappers/ProjectMapper";

export interface IProjectGateway {
  /** Raw project data only, not the domain `Project` — `activeTaskCount` is
   * cross-module (see `ProjectMapper`), so mapping to the full entity happens
   * in `ListProjectsUseCase`, not here.
   * @throws {import("../../domain/errors/ProjectsError").ProjectsError} */
  listProjects(accessToken: string): Promise<ProjectApiSource[]>;
}
