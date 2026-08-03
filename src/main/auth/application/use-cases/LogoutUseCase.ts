import type { UseCase } from "../../../shared/UseCase";
import type { ITokenStore } from "../ports/ITokenStore";

export class LogoutUseCase implements UseCase<void, void> {
  constructor(private readonly tokenStore: ITokenStore) {}

  async execute(): Promise<void> {
    await this.tokenStore.clear();
  }
}
