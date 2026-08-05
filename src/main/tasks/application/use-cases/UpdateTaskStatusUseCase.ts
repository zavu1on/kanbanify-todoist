import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { UpdateTaskStatusInput } from "../dtos/UpdateTaskStatusInput";
import type { ITaskGateway } from "../ports/ITaskGateway";

export class UpdateTaskStatusUseCase
  implements UseCase<UpdateTaskStatusInput, Task>
{
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: UpdateTaskStatusInput): Promise<Task> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    return this.taskGateway.updateTaskStatus(
      accessToken.value,
      input.taskId,
      input.status,
    );
  }
}
