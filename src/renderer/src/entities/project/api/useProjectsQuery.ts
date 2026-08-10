import { useQuery } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/api/queryConfig";
import { projectsListQueryKey } from "../model/queryKeys";
import { listProjects } from "./listProjects";

/** Free tier caps projects at 5 (see SPECIFICATION.md "Ограничения тарифа"),
 * so unlike tasks this is a plain query, not `useInfiniteQuery` — the whole
 * list comes back in one IPC call. */
export const useProjectsQuery = () =>
  useQuery({
    queryKey: projectsListQueryKey,
    queryFn: listProjects,
    staleTime: STALE_TIME,
  });
