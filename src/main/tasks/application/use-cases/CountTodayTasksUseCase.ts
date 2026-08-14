import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { InvalidTaskSessionError } from "../../domain/errors/InvalidTaskSessionError";
import type { ITaskGateway } from "../ports/ITaskGateway";
import { TODAY_FILTER_QUERY } from "./ListTodayTasksUseCase";

/** Sidebar badge for the Today nav link (SPECIFICATION.md "Сайдбар": "у
 * Сегодня он включает просроченные") — same today-or-overdue filter as
 * `ListTodayTasksUseCase`, summed across the full pagination like
 * `CountUnfinishedTasksUseCase`. */
export class CountTodayTasksUseCase implements UseCase<void, number> {
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
      const page = await this.taskGateway.listTasksByFilter(
        accessToken.value,
        cursor,
        TODAY_FILTER_QUERY,
      );
      count += page.tasks.length;
      cursor = page.nextCursor;
    } while (cursor !== null);

    return count;
  }
}
