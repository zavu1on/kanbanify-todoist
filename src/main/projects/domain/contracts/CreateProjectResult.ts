import type { ProjectDTO } from "../dtos/ProjectDTO";
import type { ProjectsFailure } from "./ProjectsFailure";

export type CreateProjectResult =
  | { ok: true; project: ProjectDTO }
  | ProjectsFailure;
