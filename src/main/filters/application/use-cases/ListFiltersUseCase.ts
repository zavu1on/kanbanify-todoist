import type { UseCase } from "../../../shared/UseCase";
import type { Filter } from "../../domain/entities/Filter";
import type { IFilterStore } from "../ports/IFilterStore";

export class ListFiltersUseCase implements UseCase<void, Filter[]> {
  constructor(private readonly filterStore: IFilterStore) {}

  async execute(): Promise<Filter[]> {
    return this.filterStore.list();
  }
}
