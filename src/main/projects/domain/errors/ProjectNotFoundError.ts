import { ProjectsError } from "./ProjectsError";

export class ProjectNotFoundError extends ProjectsError {
  constructor(message = "Project not found") {
    super(message);
  }
}
