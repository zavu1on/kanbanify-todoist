import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway } from "../ports/ITaskGateway";

export class DeleteTaskUseCase implements UseCase<string, void> {
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(taskId: string): Promise<void> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    await this.taskGateway.delete(accessToken.value, taskId);
  }
}
