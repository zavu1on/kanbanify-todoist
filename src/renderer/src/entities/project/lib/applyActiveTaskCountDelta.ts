import type { QueryClient } from "@tanstack/react-query";
import type { ProjectsListResult } from "@/main/projects";
import { snapshotAndUpdate } from "@/shared/api/optimisticCache";
import { projectsListQueryKey } from "../model/queryKeys";

/**
 * Optimistically bumps one project's sidebar `activeTaskCount` badge by
 * `delta`, returning the pre-bump cache snapshot for rollback on failure —
 * used wherever a task mutation (create/complete/delete/move) changes how
 * many active tasks a project has.
 */
export const applyActiveTaskCountDelta = (
  queryClient: QueryClient,
  projectId: string,
  delta: number,
): ProjectsListResult | undefined =>
  snapshotAndUpdate<ProjectsListResult>(
    queryClient,
    projectsListQueryKey,
    (data) =>
      data?.ok
        ? {
            ...data,
            projects: data.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    activeTaskCount: project.activeTaskCount + delta,
                  }
                : project,
            ),
          }
        : data,
  );
