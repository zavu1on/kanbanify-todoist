import { LabelsError } from "./LabelsError";

export class TodoistLabelsConnectionError extends LabelsError {
  constructor(
    message = "Could not connect to Todoist. Check your internet connection and try again",
  ) {
    super(message);
  }
}
