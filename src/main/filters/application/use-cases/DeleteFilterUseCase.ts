import type { UseCase } from "../../../shared/UseCase";
import type { IFilterStore } from "../ports/IFilterStore";

export class DeleteFilterUseCase implements UseCase<number, void> {
  constructor(private readonly filterStore: IFilterStore) {}

  async execute(id: number): Promise<void> {
    await this.filterStore.delete(id);
  }
}
