import type { DeleteFilterResult } from "@/main/filters";

export const deleteFilter = (id: number): Promise<DeleteFilterResult> =>
  window.api.filters.delete(id);
