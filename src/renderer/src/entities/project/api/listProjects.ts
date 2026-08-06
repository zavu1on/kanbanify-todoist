import type { ProjectsListResult } from "@/main/projects";

export const listProjects = (): Promise<ProjectsListResult> =>
  window.api.projects.list();
