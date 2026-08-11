import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { byDueDate } from "../../domain/entities/byDueDate";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";

export class ListTasksUseCase implements UseCase<string | null, TaskListPage> {
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(
    cursor: string | null,
    projectId?: string,
    parentId?: string,
  ): Promise<TaskListPage> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    const page = await this.taskGateway.listTasks(
      accessToken.value,
      cursor,
      projectId,
      parentId,
    );
    // Subtasks only ever appear when explicitly requested via `parentId` (a
    // task's own subtasks list) — every other list (Tasks, a project page)
    // hides them so they don't show up twice as standalone cards.
    const tasks =
      parentId === undefined
        ? page.tasks.filter((task) => task.parentId === null)
        : page.tasks;
    return { ...page, tasks: [...tasks].sort(byDueDate) };
  }
}
