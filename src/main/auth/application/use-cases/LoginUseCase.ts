import type { UseCase } from "../../../shared/UseCase";
import { PLAINTEXT_TOKEN_STORAGE_WARNING } from "../../domain/contracts/AuthFailure";
import type { AccessToken } from "../../domain/value-objects/AccessToken";
import type { LoginOutput } from "../dtos/LoginOutput";
import type { ITodoistUserGateway } from "../ports/ITodoistUserGateway";
import type { ITokenStore } from "../ports/ITokenStore";

export class LoginUseCase implements UseCase<AccessToken, LoginOutput> {
  constructor(
    private readonly userGateway: ITodoistUserGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(accessToken: AccessToken): Promise<LoginOutput> {
    const user = await this.userGateway.fetchCurrentUser(accessToken.value);
    const { encrypted } = await this.tokenStore.save(accessToken.value);

    return {
      user,
      tokenStorageWarning: encrypted
        ? undefined
        : PLAINTEXT_TOKEN_STORAGE_WARNING,
    };
  }
}
