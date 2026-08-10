import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { UpdateTaskInput } from "../dtos/UpdateTaskInput";
import type { ITaskGateway } from "../ports/ITaskGateway";

export class UpdateTaskUseCase implements UseCase<UpdateTaskInput, Task> {
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: UpdateTaskInput): Promise<Task> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    const original = await this.taskGateway.getTask(
      accessToken.value,
      input.taskId,
    );
    // Field validation (title emptiness) happens inside `Task#update`.
    original.update({
      title: input.title,
      description: input.description,
      priority: input.priority,
      due: input.due,
      labels: input.labels,
    });
    original.changeStatus(input.kanbanStatus);

    const saved = await this.taskGateway.save(accessToken.value, original);
    // A subtask's project is inherited from its parent and never independently
    // editable (SPECIFICATION.md: "созданная подзадача наследует проект
    // родителя") — `move`'s underlying Todoist command accepts exactly one of
    // project/section/parent, so moving a subtask by project alone would
    // silently detach it from its parent. Ignore any `projectId` a caller
    // supplies for a subtask rather than risk that, instead of trusting the
    // frontend to never send one.
    if (original.parentId !== null) return saved;
    // `save` never persists `projectId` (Todoist has no field for it on
    // `updateTask`, see `ITaskGateway.move`) — only pay for the extra API
    // call when the form actually changed the project.
    if (input.projectId === original.projectId) return saved;

    return this.taskGateway.move(accessToken.value, saved.id, input.projectId);
  }
}
