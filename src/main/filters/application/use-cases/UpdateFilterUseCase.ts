import type { UseCase } from "../../../shared/UseCase";
import type { Filter } from "../../domain/entities/Filter";
import { FilterNotFoundError } from "../../domain/errors/FilterNotFoundError";
import type { UpdateFilterInput } from "../dtos/UpdateFilterInput";
import type { IFilterStore } from "../ports/IFilterStore";

export class UpdateFilterUseCase implements UseCase<UpdateFilterInput, Filter> {
  constructor(private readonly filterStore: IFilterStore) {}

  async execute(input: UpdateFilterInput): Promise<Filter> {
    const filter = await this.filterStore.get(input.id);
    if (filter === null) throw new FilterNotFoundError();

    // Mutates `filter` in place and validates the new title — throws
    // `InvalidFilterTitleError` before any save call is made.
    filter.updateDetails({
      title: input.title,
      color: input.color,
      query: input.query,
    });

    return this.filterStore.update(filter);
  }
}
