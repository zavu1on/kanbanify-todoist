import { CommentsError } from "./CommentsError";

/** Thrown when there is no stored access token, or Todoist rejects it (401/403). */
export class InvalidCommentSessionError extends CommentsError {
  constructor(
    message = "Your Todoist session has expired. Please sign in again",
  ) {
    super(message);
  }
}
