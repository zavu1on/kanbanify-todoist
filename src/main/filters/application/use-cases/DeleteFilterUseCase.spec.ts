import { describe, expect, it, vi } from "vitest";
import type { IFilterStore } from "../ports/IFilterStore";
import { DeleteFilterUseCase } from "./DeleteFilterUseCase";

const buildFilterStore = (): IFilterStore => ({
  list: vi.fn(),
  get: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe("DeleteFilterUseCase", () => {
  it("delegates to the store with the given id", async () => {
    const filterStore = buildFilterStore();
    const useCase = new DeleteFilterUseCase(filterStore);

    await useCase.execute(1);

    expect(filterStore.delete).toHaveBeenCalledWith(1);
  });
});
