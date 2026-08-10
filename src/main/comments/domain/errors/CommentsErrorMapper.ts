import type { CommentsError } from "./CommentsError";
import { InvalidCommentSessionError } from "./InvalidCommentSessionError";
import { TodoistCommentsConnectionError } from "./TodoistCommentsConnectionError";
import { UnknownCommentsError } from "./UnknownCommentsError";

export type CommentsErrorKind = "auth" | "network" | "unknown";

/**
 * Builds the correct `CommentsError` subtype for a classified failure kind. The
 * classification itself (which SDK error means what) happens in infrastructure —
 * it needs `TodoistRequestError` — this only knows the domain error hierarchy.
 */
export class CommentsErrorMapper {
  toDomainError(kind: CommentsErrorKind, message?: string): CommentsError {
    switch (kind) {
      case "auth":
        return new InvalidCommentSessionError();
      case "network":
        return new TodoistCommentsConnectionError();
      default:
        return new UnknownCommentsError(message);
    }
  }
}
