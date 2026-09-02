import type { FilterDTO } from "../dtos/FilterDTO";
import type { FiltersFailure } from "./FiltersFailure";

export type CreateFilterResult =
  | { ok: true; filter: FilterDTO }
  | FiltersFailure;
