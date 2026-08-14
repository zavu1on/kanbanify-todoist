import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { byDueDate } from "../../domain/entities/byDueDate";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";

/** Todoist filter query for the Today page (SPECIFICATION.md "Сегодня"):
 * unfinished top-level tasks due today or overdue — mirrors the `today |
 * overdue` dedup Todoist's own `overdue` filter already applies (see
 * SPECIFICATION.md "Срок"), so a today-task with a past time only ever
 * shows up once. */
export const TODAY_FILTER_QUERY = "(today | overdue) & !subtask";

export class ListTodayTasksUseCase
  implements UseCase<string | null, TaskListPage>
{
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(cursor: string | null): Promise<TaskListPage> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    const page = await this.taskGateway.listTasksByFilter(
      accessToken.value,
      cursor,
      TODAY_FILTER_QUERY,
    );
    return { ...page, tasks: [...page.tasks].sort(byDueDate) };
  }
}
