import { useQuery } from "@tanstack/react-query";
import { labelsListQueryKey } from "../model/queryKeys";
import { listLabels } from "./listLabels";

/** A personal Todoist label set is small — like `useProjectsQuery`, this is a
 * plain query, not `useInfiniteQuery`; the whole list comes back in one IPC call. */
export const useLabelsQuery = () =>
  useQuery({
    queryKey: labelsListQueryKey,
    queryFn: listLabels,
    staleTime: 60_000,
  });
