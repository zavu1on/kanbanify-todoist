/**
 * Public API of the `projects` module — the only surface other processes see.
 */

export type { ArchiveProjectResult } from "./domain/contracts/ArchiveProjectResult";
export type { CreateProjectRequest } from "./domain/contracts/CreateProjectRequest";
export type { CreateProjectResult } from "./domain/contracts/CreateProjectResult";
export type { DeleteProjectResult } from "./domain/contracts/DeleteProjectResult";
export type { ProjectDTO } from "./domain/dtos/ProjectDTO";
export type { ProjectsErrorType } from "./domain/contracts/ProjectsFailure";
export type { ProjectsListResult } from "./domain/contracts/ProjectsListResult";
export type { UpdateProjectRequest } from "./domain/contracts/UpdateProjectRequest";
export type { UpdateProjectResult } from "./domain/contracts/UpdateProjectResult";
export { projectNameSchema } from "./domain/value-objects/ProjectName";
