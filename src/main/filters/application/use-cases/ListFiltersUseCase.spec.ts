import { describe, expect, it, vi } from "vitest";
import { Filter } from "../../domain/entities/Filter";
import type { IFilterStore } from "../ports/IFilterStore";
import { ListFiltersUseCase } from "./ListFiltersUseCase";

const buildFilterStore = (filters: Filter[]): IFilterStore => ({
  list: vi.fn().mockResolvedValue(filters),
  get: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("ListFiltersUseCase", () => {
  it("delegates to the store and returns its filters", async () => {
    const filters = [
      Filter.reconstitute({
        id: 1,
        title: "Urgent",
        color: "red",
        query: "p1",
      }),
    ];
    const filterStore = buildFilterStore(filters);
    const useCase = new ListFiltersUseCase(filterStore);

    const result = await useCase.execute();

    expect(filterStore.list).toHaveBeenCalledTimes(1);
    expect(result).toBe(filters);
  });
});
