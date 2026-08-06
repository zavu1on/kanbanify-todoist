import type {
  CreateProjectRequest,
  CreateProjectResult,
} from "@/main/projects";

export const createProject = (
  input: CreateProjectRequest,
): Promise<CreateProjectResult> => window.api.projects.create(input);
