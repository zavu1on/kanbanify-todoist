import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { CompleteTaskInput } from "../dtos/CompleteTaskInput";
import type { ITaskGateway } from "../ports/ITaskGateway";

export class CompleteTaskUseCase implements UseCase<CompleteTaskInput, void> {
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: CompleteTaskInput): Promise<void> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    const task = await this.taskGateway.getTask(
      accessToken.value,
      input.taskId,
    );
    // Completion (and its already-completed guard) is entity logic — see `Task.complete`.
    task.complete();

    await this.taskGateway.close(accessToken.value, task.id);
  }
}
