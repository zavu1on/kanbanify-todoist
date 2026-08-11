import { AttachmentsError } from "./AttachmentsError";

export class TodoistAttachmentsConnectionError extends AttachmentsError {
  constructor(
    message = "Could not connect to Todoist. Check your internet connection and try again",
  ) {
    super(message);
  }
}
