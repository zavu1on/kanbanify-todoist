import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { Task } from "../../domain/entities/Task";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway, TaskListPage } from "../ports/ITaskGateway";

/** `null` sorts last: tasks without a due date go after all dated ones. */
const dueTimestamp = (task: Task): number | null =>
  task.due ? new Date(task.due.datetime ?? task.due.date).getTime() : null;

// ponytail: sorts within each fetched page only, not across the full pagination
// cursor — a true global sort would mean fetching all pages upfront, which
// defeats the point of "Load more". Good enough while lists stay near one page.
const byDueDate = (a: Task, b: Task): number => {
  const aTime = dueTimestamp(a);
  const bTime = dueTimestamp(b);
  if (aTime === null) return bTime === null ? 0 : 1;
  if (bTime === null) return -1;
  return aTime - bTime;
};

export class ListTasksUseCase implements UseCase<string | null, TaskListPage> {
  constructor(
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(cursor: string | null): Promise<TaskListPage> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidTaskSessionError();

    const page = await this.taskGateway.listTasks(accessToken.value, cursor);
    return { ...page, tasks: [...page.tasks].sort(byDueDate) };
  }
}
