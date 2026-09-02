import type { GetProjectResult, ProjectsListResult } from "@/main/projects";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/api/queryConfig";
import { projectQueryKey, projectsListQueryKey } from "../model/queryKeys";
import { getProject } from "./getProject";

/** `id` is optional so callers on a route that may or may not scope to a
 * project (e.g. `pages/tasks`, mounted for both `/tasks` and
 * `/projects/:projectId`) can call this hook unconditionally. */
export const useProjectQuery = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: projectQueryKey(id ?? ""),
    queryFn: () => getProject(id as string),
    enabled: id !== undefined,
    staleTime: STALE_TIME,
    initialData: (): GetProjectResult | undefined => {
      const list =
        queryClient.getQueryData<ProjectsListResult>(projectsListQueryKey);
      const project = list?.ok
        ? list.projects.find((p) => p.id === id)
        : undefined;
      return project ? { ok: true, project } : undefined;
    },
  });
};
