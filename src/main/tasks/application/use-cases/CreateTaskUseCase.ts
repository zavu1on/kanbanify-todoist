import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { CreateTaskInput } from "../dtos/CreateTaskInput";
import type { ITaskGateway } from "../ports/ITaskGateway";

export class CreateTaskUseCase implements UseCase<CreateTaskInput, Task> {
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    // Validation (title emptiness) happens inside `Task.create` — it throws
    // `InvalidTaskTitleError` before any port call is made.
    const task = Task.create({
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      priority: input.priority,
      due: input.due,
      kanbanStatus: input.kanbanStatus,
      labels: input.labels,
    });

    return this.taskGateway.create(accessToken.value, task);
  }
}
