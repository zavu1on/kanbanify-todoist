import type { QueryClient } from "@tanstack/react-query";
import { filtersListQueryKey } from "@/entities/filter";
import { projectsListQueryKey } from "@/entities/project";
import type { FiltersListResult } from "@/main/filters";
import type { ProjectsListResult } from "@/main/projects";
import type { TaskDTO } from "@/main/tasks";
import { snapshotAndUpdate } from "@/shared/api/optimisticCache";
import { taskMatchesFilterQuery } from "./matchesFilterQuery";

/**
 * Optimistically bumps every cached filter's sidebar `taskCount` badge by
 * comparing whether `before`/`after` match each filter's saved query (via
 * `taskMatchesFilterQuery`, the same check `reconcileTaskInLists` uses to
 * decide a filter list's own membership) — a task can match zero or several
 * filters at once, unlike a project (exactly one), so this walks every
 * cached filter instead of touching a single id like
 * `applyActiveTaskCountDelta` does. `before`/`after` are `null` for a
 * create/complete/delete (no task on one side of the change). Returns the
 * pre-bump cache snapshot for rollback on failure.
 */
export const applyFilterTaskCountDelta = (
  queryClient: QueryClient,
  before: TaskDTO | null,
  after: TaskDTO | null,
): FiltersListResult | undefined =>
  snapshotAndUpdate<FiltersListResult>(
    queryClient,
    filtersListQueryKey,
    (data) => {
      if (!data?.ok) return data;

      const projectsData =
        queryClient.getQueryData<ProjectsListResult>(projectsListQueryKey);
      const projectNameOf = (task: TaskDTO): string | null =>
        projectsData?.ok
          ? (projectsData.projects.find((p) => p.id === task.projectId)?.name ??
            null)
          : null;

      return {
        ...data,
        filters: data.filters.map((filter) => {
          const matchedBefore = before
            ? taskMatchesFilterQuery(
                filter.query,
                before,
                projectNameOf(before),
              )
            : false;
          const matchedAfter = after
            ? taskMatchesFilterQuery(filter.query, after, projectNameOf(after))
            : false;
          if (matchedBefore === matchedAfter) return filter;
          return {
            ...filter,
            taskCount: filter.taskCount + (matchedAfter ? 1 : -1),
          };
        }),
      };
    },
  );
