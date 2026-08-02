import { AuthError } from "./AuthError";

export class InvalidAccessTokenError extends AuthError {
  constructor(
    message = "Access token is invalid. Check that you copied the current token from Todoist settings",
  ) {
    super(message);
  }
}
