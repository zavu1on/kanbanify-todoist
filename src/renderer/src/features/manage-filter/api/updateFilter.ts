import type { UpdateFilterRequest, UpdateFilterResult } from "@/main/filters";

export const updateFilter = (
  id: number,
  input: UpdateFilterRequest,
): Promise<UpdateFilterResult> => window.api.filters.update(id, input);
