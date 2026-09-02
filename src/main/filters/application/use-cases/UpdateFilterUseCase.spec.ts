import { describe, expect, it, vi } from "vitest";
import { Filter } from "../../domain/entities/Filter";
import { FilterNotFoundError } from "../../domain/errors/FilterNotFoundError";
import { InvalidFilterTitleError } from "../../domain/errors/InvalidFilterTitleError";
import { UpdateFilterInput } from "../dtos/UpdateFilterInput";
import type { IFilterStore } from "../ports/IFilterStore";
import { UpdateFilterUseCase } from "./UpdateFilterUseCase";

const existingFilter = () =>
  Filter.reconstitute({ id: 1, title: "Urgent", color: "red", query: "p1" });

const buildFilterStore = (filter: Filter | null): IFilterStore => ({
  list: vi.fn(),
  get: vi.fn().mockResolvedValue(filter),
  insert: vi.fn(),
  update: vi.fn().mockImplementation((f: Filter) => Promise.resolve(f)),
  delete: vi.fn(),
});

describe("UpdateFilterUseCase", () => {
  it("throws FilterNotFoundError when the filter doesn't exist", async () => {
    const filterStore = buildFilterStore(null);
    const useCase = new UpdateFilterUseCase(filterStore);

    await expect(
      useCase.execute(new UpdateFilterInput(999, "Renamed", "blue", "p2")),
    ).rejects.toThrow(FilterNotFoundError);
    expect(filterStore.update).not.toHaveBeenCalled();
  });

  it("throws InvalidFilterTitleError for a blank title without calling the store's update", async () => {
    const filterStore = buildFilterStore(existingFilter());
    const useCase = new UpdateFilterUseCase(filterStore);

    await expect(
      useCase.execute(new UpdateFilterInput(1, "   ", "blue", "p2")),
    ).rejects.toThrow(InvalidFilterTitleError);
    expect(filterStore.update).not.toHaveBeenCalled();
  });

  it("mutates the loaded filter and delegates to the store", async () => {
    const filterStore = buildFilterStore(existingFilter());
    const useCase = new UpdateFilterUseCase(filterStore);

    const filter = await useCase.execute(
      new UpdateFilterInput(1, "  Renamed  ", "blue", "p2"),
    );

    expect(filterStore.update).toHaveBeenCalledTimes(1);
    expect(filter.title).toBe("Renamed");
    expect(filter.color).toBe("blue");
    expect(filter.query).toBe("p2");
    expect(filter.id).toBe(1);
  });
});
