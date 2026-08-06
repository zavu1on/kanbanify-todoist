import { ProjectsError } from "./ProjectsError";

export class InvalidProjectNameError extends ProjectsError {
  constructor(message = "Invalid project name") {
    super(message);
  }
}
