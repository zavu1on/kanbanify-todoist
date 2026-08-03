import type { UseCase } from "../../../shared/UseCase";
import type { SessionCheckOutput } from "../dtos/SessionCheckOutput";
import type { ITodoistUserGateway } from "../ports/ITodoistUserGateway";
import type { ITokenStore } from "../ports/ITokenStore";

export class CheckSessionUseCase implements UseCase<void, SessionCheckOutput> {
  constructor(
    private readonly userGateway: ITodoistUserGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(): Promise<SessionCheckOutput> {
    const storedToken = await this.tokenStore.load();
    if (storedToken === null) return { status: "no_token" };

    const user = await this.userGateway.fetchCurrentUser(storedToken);
    return { status: "authenticated", user };
  }
}
