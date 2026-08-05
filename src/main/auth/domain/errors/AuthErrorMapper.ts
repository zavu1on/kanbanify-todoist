import type { AuthError } from "./AuthError";
import { InvalidAccessTokenError } from "./InvalidAccessTokenError";
import { TodoistAuthConnectionError } from "./TodoistAuthConnectionError";
import { UnknownAuthError } from "./UnknownAuthError";

export type AuthErrorKind = "auth" | "network" | "unknown";

/**
 * Builds the correct `AuthError` subtype for a classified failure kind. The
 * classification itself (which SDK error means what) happens in infrastructure —
 * it needs `TodoistRequestError` — this only knows the domain error hierarchy.
 */
export class AuthErrorMapper {
  toDomainError(kind: AuthErrorKind, message?: string): AuthError {
    switch (kind) {
      case "auth":
        return new InvalidAccessTokenError();
      case "network":
        return new TodoistAuthConnectionError();
      default:
        return new UnknownAuthError(message);
    }
  }
}
