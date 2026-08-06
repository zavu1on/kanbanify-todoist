import type { ArchiveProjectResult } from "@/main/projects";

export const archiveProject = (id: string): Promise<ArchiveProjectResult> =>
  window.api.projects.archive(id);
