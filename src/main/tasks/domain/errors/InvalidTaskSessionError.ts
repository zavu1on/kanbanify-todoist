import { TasksError } from "./TasksError";

/** Thrown when there is no stored access token, or Todoist rejects it (401/403). */
export class InvalidTaskSessionError extends TasksError {
  constructor(
    message = "Your Todoist session has expired. Please sign in again",
  ) {
    super(message);
  }
}
