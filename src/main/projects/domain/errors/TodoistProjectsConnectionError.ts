import { ProjectsError } from "./ProjectsError";

export class TodoistProjectsConnectionError extends ProjectsError {
  constructor(
    message = "Could not connect to Todoist. Check your internet connection and try again",
  ) {
    super(message);
  }
}
