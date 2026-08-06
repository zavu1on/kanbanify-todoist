import type { ProjectDTO } from "../dtos/ProjectDTO";
import type { ProjectsFailure } from "./ProjectsFailure";

export type UpdateProjectResult =
  | { ok: true; project: ProjectDTO }
  | ProjectsFailure;
