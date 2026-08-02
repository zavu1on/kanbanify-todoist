import { AuthError } from "./AuthError";

export class UnknownAuthError extends AuthError {
  constructor(message = "Unknown error while signing in to Todoist") {
    super(message);
  }
}
