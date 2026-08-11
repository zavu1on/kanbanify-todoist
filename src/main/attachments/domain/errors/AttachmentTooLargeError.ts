import { AttachmentsError } from "./AttachmentsError";

/** Thrown by `Attachment.create` before any network call, when a file exceeds
 * `MAX_ATTACHMENT_SIZE_BYTES`. */
export class AttachmentTooLargeError extends AttachmentsError {
  constructor(message = "File is too large") {
    super(message);
  }
}
