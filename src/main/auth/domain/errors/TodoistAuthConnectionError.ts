import { AuthError } from "./AuthError";

export class TodoistAuthConnectionError extends AuthError {
  constructor(
    message = "Could not connect to Todoist. Check your internet connection and try again",
  ) {
    super(message);
  }
}
