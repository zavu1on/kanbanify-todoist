import type { FilterDTO } from "../dtos/FilterDTO";
import type { FiltersFailure } from "./FiltersFailure";

export type UpdateFilterResult =
  | { ok: true; filter: FilterDTO }
  | FiltersFailure;
