import type { ProjectDTO } from "../dtos/ProjectDTO";
import type { ProjectsFailure } from "./ProjectsFailure";

/** The IPC-serializable shape of a `projects:list` call — the free tier caps
 * projects at 5 (see SPECIFICATION.md "Ограничения тарифа"), so unlike tasks
 * this returns the full list in one call, no cursor pagination. */
export type ProjectsListResult =
  | { ok: true; projects: ProjectDTO[] }
  | ProjectsFailure;
