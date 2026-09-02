import type { UseCase } from "../../../shared/UseCase";
import { Filter } from "../../domain/entities/Filter";
import type { CreateFilterInput } from "../dtos/CreateFilterInput";
import type { IFilterStore } from "../ports/IFilterStore";

export class CreateFilterUseCase implements UseCase<CreateFilterInput, Filter> {
  constructor(private readonly filterStore: IFilterStore) {}

  async execute(input: CreateFilterInput): Promise<Filter> {
    // Validation (title length/emptiness) happens inside `Filter.create` —
    // it throws `InvalidFilterTitleError` before any store call is made.
    const filter = Filter.create({
      title: input.title,
      color: input.color,
      query: input.query,
    });

    return this.filterStore.insert(filter);
  }
}
