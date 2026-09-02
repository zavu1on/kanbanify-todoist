import type { CreateFilterRequest, CreateFilterResult } from "@/main/filters";

export const createFilter = (
  input: CreateFilterRequest,
): Promise<CreateFilterResult> => window.api.filters.create(input);
