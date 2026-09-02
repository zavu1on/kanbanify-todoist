/**
 * Public API of the `filters` module — the only surface other processes see.
 */

export type { CreateFilterRequest } from "./domain/contracts/CreateFilterRequest";
export type { CreateFilterResult } from "./domain/contracts/CreateFilterResult";
export type { DeleteFilterResult } from "./domain/contracts/DeleteFilterResult";
export type { FilterTasksResult } from "./domain/contracts/FilterTasksResult";
export type { FiltersErrorType } from "./domain/contracts/FiltersFailure";
export type { FiltersListResult } from "./domain/contracts/FiltersListResult";
export type { UpdateFilterRequest } from "./domain/contracts/UpdateFilterRequest";
export type { UpdateFilterResult } from "./domain/contracts/UpdateFilterResult";
export type { FilterDTO } from "./domain/dtos/FilterDTO";
export { filterTitleSchema } from "./domain/value-objects/FilterTitle";
