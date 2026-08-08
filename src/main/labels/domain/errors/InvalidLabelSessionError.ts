import { LabelsError } from "./LabelsError";

/** Thrown when there is no stored access token, or Todoist rejects it (401/403). */
export class InvalidLabelSessionError extends LabelsError {
  constructor(
    message = "Your Todoist session has expired. Please sign in again",
  ) {
    super(message);
  }
}
