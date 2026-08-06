import type {
  UpdateProjectRequest,
  UpdateProjectResult,
} from "@/main/projects";

export const updateProject = (
  id: string,
  input: UpdateProjectRequest,
): Promise<UpdateProjectResult> => window.api.projects.update(id, input);
