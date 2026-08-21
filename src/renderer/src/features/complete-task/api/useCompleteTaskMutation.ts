import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  applyActiveTaskCountDelta,
  projectsListQueryKey,
} from "@/entities/project";
import {
  applyTaskCountDelta,
  isDueTodayOrOverdue,
  taskCountQueryKey,
  tasksListQueryKey,
  todayCountQueryKey,
} from "@/entities/task";
import type { TasksListResult } from "@/main/tasks";
import { completeTask } from "./completeTask";

type TasksPages = InfiniteData<TasksListResult>;

type CompleteTaskVariables = { taskId: string };

/**
 * Checking a task's checkbox (list-view or kanban-view) completes it
 * optimistically — the card is removed from `queryKey`'s cache immediately,
 * a completed task no longer being part of any active list, and put back
 * with an error notification if the API call fails. `queryKey` is the
 * caller's own list cache — same reasoning as `useChangeTaskStatusMutation`,
 * whose optimistic-write pattern this mirrors.
 */
export const useCompleteTaskMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: CompleteTaskVariables) => completeTask(taskId),

    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: taskCountQueryKey });
      await queryClient.cancelQueries({ queryKey: projectsListQueryKey });
      const previous = queryClient.getQueryData<TasksPages>(queryKey);
      // The task being completed is, by construction, visible in `queryKey`'s
      // own list — same reasoning `useUpdateTaskMutation` uses its caller-supplied
      // `task` for, just recovered from the cache here instead of threading a
      // `task` argument through every checkbox call site.
      const task = previous?.pages
        .flatMap((page) => (page.ok ? page.tasks : []))
        .find((t) => t.id === taskId);

      queryClient.setQueryData<TasksPages>(
        queryKey,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) =>
              page.ok
                ? {
                    ...page,
                    tasks: page.tasks.filter((task) => task.id !== taskId),
                  }
                : page,
            ),
          },
      );

      if (!task) return { previous };

      const { previousTaskCount, previousTodayCount } = applyTaskCountDelta(
        queryClient,
        { total: -1, today: isDueTodayOrOverdue(task) ? -1 : 0 },
      );
      const previousProjects = applyActiveTaskCountDelta(
        queryClient,
        task.projectId,
        -1,
      );

      return {
        previous,
        previousTaskCount,
        previousTodayCount,
        previousProjects,
      };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed completion surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        queryClient.setQueryData(taskCountQueryKey, context?.previousTaskCount);
        queryClient.setQueryData(
          todayCountQueryKey,
          context?.previousTodayCount,
        );
        if (context?.previousProjects) {
          queryClient.setQueryData(
            projectsListQueryKey,
            context.previousProjects,
          );
        }
        notifications.show({
          color: "red",
          title: "Couldn't complete task",
          message: result.error.message,
        });
        return;
      }

      // Unlike `useChangeTaskStatusMutation`'s drag-and-drop case, a single
      // completion has no rapid-fire jump risk, so refetch every other active
      // tasks-list page immediately (e.g. Today, if it's mounted) instead of
      // waiting for its next mount.
      queryClient.invalidateQueries({
        queryKey: tasksListQueryKey,
        refetchType: "active",
      });
      // `taskCountQueryKey` (`["tasks", "count"]`) is a fuzzy-match prefix of
      // the Today badge's `["tasks", "count", "today"]`, so this one call
      // refreshes both sidebar badges.
      queryClient.invalidateQueries({
        queryKey: taskCountQueryKey,
        refetchType: "active",
      });
      // Completing a task changes its project's `activeTaskCount` badge in the sidebar.
      queryClient.invalidateQueries({
        queryKey: projectsListQueryKey,
        refetchType: "active",
      });
    },
  });
};
