import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { byDueDate } from "../../domain/entities/byDueDate";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";

/** Todoist filter query for the Calendar page: unfinished top-level tasks
 * that have a due date (SPECIFICATION.md "Календарь" — subtasks stay hidden
 * here for the same reason `ListTasksUseCase` hides them from the flat
 * Tasks list). */
const CALENDAR_FILTER_QUERY = "!no date & !subtask";

export class ListTasksWithDueDateUseCase
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
      CALENDAR_FILTER_QUERY,
    );
    return { ...page, tasks: [...page.tasks].sort(byDueDate) };
  }
}
