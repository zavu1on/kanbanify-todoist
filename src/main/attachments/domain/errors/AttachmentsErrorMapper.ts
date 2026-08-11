import type { AttachmentsError } from "./AttachmentsError";
import { InvalidAttachmentSessionError } from "./InvalidAttachmentSessionError";
import { TodoistAttachmentsConnectionError } from "./TodoistAttachmentsConnectionError";
import { UnknownAttachmentsError } from "./UnknownAttachmentsError";

export type AttachmentsErrorKind = "auth" | "network" | "unknown";

/**
 * Builds the correct `AttachmentsError` subtype for a classified failure kind. The
 * classification itself (which SDK error means what) happens in infrastructure —
 * it needs `TodoistRequestError` — this only knows the domain error hierarchy.
 */
export class AttachmentsErrorMapper {
  toDomainError(
    kind: AttachmentsErrorKind,
    message?: string,
  ): AttachmentsError {
    switch (kind) {
      case "auth":
        return new InvalidAttachmentSessionError();
      case "network":
        return new TodoistAttachmentsConnectionError();
      default:
        return new UnknownAttachmentsError(message);
    }
  }
}
