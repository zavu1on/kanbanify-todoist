import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway } from "../ports/ITaskGateway";

export class CountUnfinishedTasksUseCase implements UseCase<void, number> {
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(): Promise<number> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    let count = 0;
    let cursor: string | null = null;
    do {
      const page = await this.taskGateway.listTasks(accessToken.value, cursor);
      count += page.tasks.length;
      cursor = page.nextCursor;
    } while (cursor !== null);

    return count;
  }
}
