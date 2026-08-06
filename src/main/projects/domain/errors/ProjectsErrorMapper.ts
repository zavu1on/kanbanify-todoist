import { InvalidProjectSessionError } from "./InvalidProjectSessionError";
import type { ProjectsError } from "./ProjectsError";
import { TodoistProjectsConnectionError } from "./TodoistProjectsConnectionError";
import { UnknownProjectsError } from "./UnknownProjectsError";

export type ProjectsErrorKind = "auth" | "network" | "unknown";

/**
 * Builds the correct `ProjectsError` subtype for a classified failure kind. The
 * classification itself (which SDK error means what) happens in infrastructure —
 * it needs `TodoistRequestError` — this only knows the domain error hierarchy.
 */
export class ProjectsErrorMapper {
  toDomainError(kind: ProjectsErrorKind, message?: string): ProjectsError {
    switch (kind) {
      case "auth":
        return new InvalidProjectSessionError();
      case "network":
        return new TodoistProjectsConnectionError();
      default:
        return new UnknownProjectsError(message);
    }
  }
}
