import { CommentsError } from "./CommentsError";

export class TodoistCommentsConnectionError extends CommentsError {
  constructor(
    message = "Could not connect to Todoist. Check your internet connection and try again",
  ) {
    super(message);
  }
}
