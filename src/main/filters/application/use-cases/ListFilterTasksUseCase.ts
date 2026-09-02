import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type {
  ITaskGateway,
  TaskListPage,
} from "../../../tasks/application/ports/ITaskGateway";
import { FilterNotFoundError } from "../../domain/errors/FilterNotFoundError";
import { InvalidFilterSessionError } from "../../domain/errors/InvalidFilterSessionError";
import type { IFilterStore } from "../ports/IFilterStore";

/** Loads one page of tasks matching a saved filter's query — the only
 * filters use-case that reaches outside `IFilterStore` into another module's
 * port: the query itself is executed against Todoist through the `tasks`
 * module's own gateway (`ITaskGateway.listTasksByFilter`, already used by
 * `ListTodayTasksUseCase`/`ListTasksWithDueDateUseCase` for the same purpose),
 * not a filters-owned copy of it — see BACKEND_CODE_STYLE_GUIDE.md "Порт
 * может использоваться use-case'ами другого модуля". */
export class ListFilterTasksUseCase implements UseCase<number, TaskListPage> {
  constructor(
    private readonly filterStore: IFilterStore,
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(
    filterId: number,
    cursor: string | null = null,
  ): Promise<TaskListPage> {
    const filter = await this.filterStore.get(filterId);
    if (filter === null) throw new FilterNotFoundError();

    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidFilterSessionError();

    return this.taskGateway.listTasksByFilter(
      accessToken.value,
      cursor,
      filter.query,
    );
  }
}
