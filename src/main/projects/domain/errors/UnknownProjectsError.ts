import { ProjectsError } from "./ProjectsError";

export class UnknownProjectsError extends ProjectsError {
  constructor(message = "Unknown error while loading projects from Todoist") {
    super(message);
  }
}
