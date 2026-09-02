import { describe, expect, it, vi } from "vitest";
import { Filter } from "../../domain/entities/Filter";
import { InvalidFilterTitleError } from "../../domain/errors/InvalidFilterTitleError";
import type { IFilterStore } from "../ports/IFilterStore";
import { CreateFilterInput } from "../dtos/CreateFilterInput";
import { CreateFilterUseCase } from "./CreateFilterUseCase";

const buildFilterStore = (): IFilterStore => ({
  list: vi.fn(),
  get: vi.fn(),
  insert: vi.fn().mockImplementation((filter: Filter) =>
    Promise.resolve(
      Filter.reconstitute({
        id: 42,
        title: filter.title,
        color: filter.color,
        query: filter.query,
      }),
    ),
  ),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("CreateFilterUseCase", () => {
  it("throws InvalidFilterTitleError for a blank title without calling the store", async () => {
    const filterStore = buildFilterStore();
    const useCase = new CreateFilterUseCase(filterStore);

    await expect(
      useCase.execute(new CreateFilterInput("   ", "red", "p1")),
    ).rejects.toThrow(InvalidFilterTitleError);
    expect(filterStore.insert).not.toHaveBeenCalled();
  });

  it("creates the filter with the trimmed title and delegates to the store", async () => {
    const filterStore = buildFilterStore();
    const useCase = new CreateFilterUseCase(filterStore);

    const filter = await useCase.execute(
      new CreateFilterInput("  Urgent  ", "red", "p1"),
    );

    expect(filterStore.insert).toHaveBeenCalledTimes(1);
    const insertedFilter = (filterStore.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(insertedFilter.id).toBe(0);
    expect(insertedFilter.title).toBe("Urgent");
    expect(insertedFilter.color).toBe("red");
    expect(insertedFilter.query).toBe("p1");

    expect(filter.id).toBe(42);
  });
});
