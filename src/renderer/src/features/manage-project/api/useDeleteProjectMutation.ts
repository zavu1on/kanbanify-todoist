import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsListQueryKey } from "@/entities/project";
import {
  applyTaskCountDelta,
  isDueTodayOrOverdue,
  removeProjectTasksFromLists,
  restoreTaskListSnapshots,
  taskCountQueryKey,
  tasksListQueryKey,
  todayCountQueryKey,
} from "@/entities/task";
import type { ProjectsListResult } from "@/main/projects";
import { deleteProject } from "./deleteProject";

/**
 * Removes the project from the sidebar immediately, put back on
 * failure/error (see `useChangeTaskStatusMutation` for the same pattern on
 * tasks). Deleting a project cascades to deleting all of its tasks
 * server-side (Todoist), so every cached tasks-list (Today, Calendar, the
 * project's own page, the unscoped "Tasks" page) also drops that project's
 * tasks immediately (`removeProjectTasksFromLists`), with the total/Today
 * counts adjusted by however many were actually removed.
 */
export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: projectsListQueryKey });
      await queryClient.cancelQueries({ queryKey: taskCountQueryKey });
      const previous =
        queryClient.getQueryData<ProjectsListResult>(projectsListQueryKey);

      queryClient.setQueryData<ProjectsListResult>(
        projectsListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                projects: data.projects.filter((project) => project.id !== id),
              }
            : data,
      );

      const { snapshots: listSnapshots, removedTasks } =
        await removeProjectTasksFromLists(queryClient, id);

      const { previousTaskCount, previousTodayCount } = applyTaskCountDelta(
        queryClient,
        {
          total: -removedTasks.length,
          today: -removedTasks.filter(isDueTodayOrOverdue).length,
        },
      );

      return { previous, listSnapshots, previousTaskCount, previousTodayCount };
    },

    onSuccess: (result, _id, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(projectsListQueryKey, context.previous);
        }
        if (context?.listSnapshots) {
          restoreTaskListSnapshots(queryClient, context.listSnapshots);
        }
        queryClient.setQueryData(taskCountQueryKey, context?.previousTaskCount);
        queryClient.setQueryData(
          todayCountQueryKey,
          context?.previousTodayCount,
        );
        return;
      }

      // Belt-and-braces alongside the sweep above: refreshes any active list
      // this project's tasks were in, the same way every other task mutation does.
      queryClient.invalidateQueries({
        queryKey: tasksListQueryKey,
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: taskCountQueryKey,
        refetchType: "active",
      });
    },

    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsListQueryKey, context.previous);
      }
      if (context?.listSnapshots) {
        restoreTaskListSnapshots(queryClient, context.listSnapshots);
      }
      queryClient.setQueryData(taskCountQueryKey, context?.previousTaskCount);
      queryClient.setQueryData(todayCountQueryKey, context?.previousTodayCount);
    },
  });
};
