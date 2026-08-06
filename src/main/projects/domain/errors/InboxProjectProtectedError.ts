import { ProjectsError } from "./ProjectsError";

export class InboxProjectProtectedError extends ProjectsError {
  constructor(action: "archive" | "delete") {
    super(`The Inbox project cannot be ${action}d`);
  }
}
