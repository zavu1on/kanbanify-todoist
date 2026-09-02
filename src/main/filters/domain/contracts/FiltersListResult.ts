import type { FilterDTO } from "../dtos/FilterDTO";
import type { FiltersFailure } from "./FiltersFailure";

export type FiltersListResult =
  | { ok: true; filters: FilterDTO[] }
  | FiltersFailure;
