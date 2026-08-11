import { AttachmentsError } from "./AttachmentsError";

export class UnknownAttachmentsError extends AttachmentsError {
  constructor(message = "Unknown error while handling the file attachment") {
    super(message);
  }
}
