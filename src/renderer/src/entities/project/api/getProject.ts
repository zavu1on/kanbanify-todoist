import type { GetProjectResult } from "@/main/projects";

export const getProject = (id: string): Promise<GetProjectResult> =>
  window.api.projects.get(id);
