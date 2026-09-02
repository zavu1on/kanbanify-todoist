import { useQuery } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/api/queryConfig";
import { filtersListQueryKey } from "../model/queryKeys";
import { listFilters } from "./listFilters";

/** Like `useProjectsQuery`/`useLabelsQuery` — a personal filter set is small,
 * so this is a plain query, not `useInfiniteQuery`; the whole list comes
 * back in one IPC call. */
export const useFiltersQuery = () =>
  useQuery({
    queryKey: filtersListQueryKey,
    queryFn: listFilters,
    staleTime: STALE_TIME,
  });
