import type { Filter } from "../../domain/entities/Filter";

/** Local persistence for the `Filter` entity — unlike every other port in this
 * codebase, this isn't a Todoist gateway (filters have no server-side
 * counterpart), it's this app's own storage. Async signatures match the rest
 * of the ports' shape even though a sqlite-backed implementation is
 * synchronous internally — use-cases stay agnostic to that. */
export interface IFilterStore {
  list(): Promise<Filter[]>;
  get(id: number): Promise<Filter | null>;
  insert(filter: Filter): Promise<Filter>;
  update(filter: Filter): Promise<Filter>;
  delete(id: number): Promise<void>;
}
