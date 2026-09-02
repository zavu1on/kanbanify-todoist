import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { ITaskGateway } from "../../../tasks/application/ports/ITaskGateway";
import { InvalidFilterSessionError } from "../../domain/errors/InvalidFilterSessionError";
import type { Filter } from "../../domain/entities/Filter";
import type { IFilterStore } from "../ports/IFilterStore";
import { countTasksMatchingFilter } from "../services/countTasksMatchingFilter";

export type FilterWithTaskCount = { filter: Filter; taskCount: number };

export class ListFiltersUseCase
  implements UseCase<void, FilterWithTaskCount[]>
{
  constructor(
    private readonly filterStore: IFilterStore,
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(): Promise<FilterWithTaskCount[]> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidFilterSessionError();

    const filters = await this.filterStore.list();

    return Promise.all(
      filters.map(async (filter) => ({
        filter,
        taskCount: await countTasksMatchingFilter(
          this.taskGateway,
          accessToken.value,
          filter.query,
        ),
      })),
    );
  }
}
