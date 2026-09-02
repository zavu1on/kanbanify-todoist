import type { FiltersListResult } from "@/main/filters";

export const listFilters = (): Promise<FiltersListResult> =>
  window.api.filters.list();
