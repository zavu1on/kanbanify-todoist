import type { DeleteProjectResult } from "@/main/projects";

export const deleteProject = (id: string): Promise<DeleteProjectResult> =>
  window.api.projects.delete(id);
