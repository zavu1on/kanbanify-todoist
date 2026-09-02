import type { FilterDTO } from "../dtos/FilterDTO";
import { Filter } from "../entities/Filter";

/** The subset of a stored filter row this app reads — kept structural (not
 * tied to any particular store implementation) so this mapper stays free of
 * an infrastructure import. */
export type FilterRowSource = {
  id: number;
  title: string;
  color: string;
  query: string;
};

export class FilterMapper {
  toDomain(source: FilterRowSource): Filter {
    return Filter.reconstitute(source);
  }

  /** `title`/`color`/`query` are prototype getters on `Filter`, so Electron's
   * IPC transport (structured clone) drops them — this is the plain shape
   * that actually survives the trip to the renderer. `taskCount` isn't part
   * of `Filter` itself (unlike a project's `activeTaskCount`, it isn't
   * threaded through the entity — a filter's task set only ever needs
   * counting on the list path, so the caller supplies it directly). */
  toDTO(filter: Filter, taskCount: number): FilterDTO {
    return {
      id: filter.id,
      title: filter.title,
      color: filter.color,
      query: filter.query,
      taskCount,
    };
  }
}
