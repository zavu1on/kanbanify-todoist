import { TodoistApi } from "@doist/todoist-sdk";
import type { ITodoistUserGateway } from "../application/ports/ITodoistUserGateway";
import type { AuthenticatedUser } from "../domain/entities/AuthenticatedUser";
import { AuthenticatedUserMapper } from "../domain/mappers/AuthenticatedUserMapper";
import { TodoistAuthErrorClassifier } from "./TodoistAuthErrorClassifier";

export class TodoistUserGateway implements ITodoistUserGateway {
  private readonly userMapper = new AuthenticatedUserMapper();
  private readonly errorClassifier = new TodoistAuthErrorClassifier();

  async fetchCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const user = await api.getUser();

      return this.userMapper.toDomain(user);
    });
  }
}
