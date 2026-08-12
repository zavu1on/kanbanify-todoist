import type { ProjectDTO } from "../dtos/ProjectDTO";
import type { ProjectsFailure } from "./ProjectsFailure";

export type GetProjectResult =
  | { ok: true; project: ProjectDTO }
  | ProjectsFailure;
