import { InvalidLabelSessionError } from "./InvalidLabelSessionError";
import type { LabelsError } from "./LabelsError";
import { TodoistLabelsConnectionError } from "./TodoistLabelsConnectionError";
import { UnknownLabelsError } from "./UnknownLabelsError";

export type LabelsErrorKind = "auth" | "network" | "unknown";

/**
 * Builds the correct `LabelsError` subtype for a classified failure kind. The
 * classification itself (which SDK error means what) happens in infrastructure —
 * it needs `TodoistRequestError` — this only knows the domain error hierarchy.
 */
export class LabelsErrorMapper {
  toDomainError(kind: LabelsErrorKind, message?: string): LabelsError {
    switch (kind) {
      case "auth":
        return new InvalidLabelSessionError();
      case "network":
        return new TodoistLabelsConnectionError();
      default:
        return new UnknownLabelsError(message);
    }
  }
}
