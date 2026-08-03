import { TodoistApi, TodoistRequestError } from "@doist/todoist-sdk";
import type { ITodoistUserGateway } from "../application/ports/ITodoistUserGateway";
import { AuthenticatedUser } from "../domain/entities/AuthenticatedUser";
import { InvalidAccessTokenError } from "../domain/errors/InvalidAccessTokenError";
import { TodoistAuthConnectionError } from "../domain/errors/TodoistAuthConnectionError";
import { UnknownAuthError } from "../domain/errors/UnknownAuthError";

export class TodoistUserGateway implements ITodoistUserGateway {
  async fetchCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
    try {
      const api = new TodoistApi(accessToken);
      const user = await api.getUser();

      return new AuthenticatedUser(
        user.id,
        user.fullName,
        user.email,
        user.avatarMedium ?? null,
      );
    } catch (error) {
      if (error instanceof TodoistRequestError) {
        if (error.isAuthenticationError()) {
          throw new InvalidAccessTokenError();
        }

        throw new TodoistAuthConnectionError();
      }

      throw new UnknownAuthError(
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
