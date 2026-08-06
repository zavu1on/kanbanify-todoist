import { InvalidTaskSessionError } from "./InvalidTaskSessionError";
import type { TasksError } from "./TasksError";
import { TodoistTasksConnectionError } from "./TodoistTasksConnectionError";
import { UnknownTasksError } from "./UnknownTasksError";

export type TasksErrorKind = "auth" | "network" | "unknown";

/**
 * Builds the correct `TasksError` subtype for a classified failure kind. The
 * classification itself (which SDK error means what) happens in infrastructure —
 * it needs `TodoistRequestError` — this only knows the domain error hierarchy.
 */
export class TasksErrorMapper {
  toDomainError(kind: TasksErrorKind, message?: string): TasksError {
    switch (kind) {
      case "auth":
        return new InvalidTaskSessionError();
      case "network":
        return new TodoistTasksConnectionError();
      default:
        return new UnknownTasksError(message);
    }
  }
}
