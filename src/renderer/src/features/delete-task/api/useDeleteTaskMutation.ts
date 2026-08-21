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
  removeTaskFromLists,
  restoreTaskListSnapshots,
  taskCountQueryKey,
  tasksListQueryKey,
  todayCountQueryKey,
} from "@/entities/task";
import type { TasksListResult } from "@/main/tasks";
import { deleteTask } from "./deleteTask";

type TasksPages = InfiniteData<TasksListResult>;

type DeleteTaskVariables = { taskId: string };

/**
 * Deleting a task from its detail modal is optimistic — the card is removed
 * immediately from every already-cached tasks-list (`removeTaskFromLists`),
 * not just `queryKey`'s (the caller's own screen, already closed by this
 * point), and put back everywhere with an error notification if the API
 * call fails.
 */
export const useDeleteTaskMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: DeleteTaskVariables) => deleteTask(taskId),

    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: taskCountQueryKey });
      await queryClient.cancelQueries({ queryKey: projectsListQueryKey });
      // The task being deleted is, by construction, visible in `queryKey`'s
      // own list — same reasoning `useUpdateTaskMutation` uses its caller-
      // supplied `task` for, just recovered from the cache here instead of
      // threading a `task` argument through every checkbox/menu call site.
      const previous = queryClient.getQueryData<TasksPages>(queryKey);
      const task = previous?.pages
        .flatMap((page) => (page.ok ? page.tasks : []))
        .find((t) => t.id === taskId);

      const listSnapshots = await removeTaskFromLists(queryClient, taskId);

      if (!task) return { listSnapshots };

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
        listSnapshots,
        previousTaskCount,
        previousTodayCount,
        previousProjects,
      };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed delete surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.listSnapshots) {
          restoreTaskListSnapshots(queryClient, context.listSnapshots);
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
          title: "Couldn't delete task",
          message: result.error.message,
        });
        return;
      }

      // Unlike `useChangeTaskStatusMutation`'s drag-and-drop case, a single
      // delete has no rapid-fire jump risk, so refetch every other active
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
      // A deleted task changes its project's `activeTaskCount` badge in the sidebar.
      queryClient.invalidateQueries({
        queryKey: projectsListQueryKey,
        refetchType: "active",
      });
    },

    onError: (_error, _variables, context) => {
      if (context?.listSnapshots) {
        restoreTaskListSnapshots(queryClient, context.listSnapshots);
      }
      queryClient.setQueryData(taskCountQueryKey, context?.previousTaskCount);
      queryClient.setQueryData(todayCountQueryKey, context?.previousTodayCount);
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectsListQueryKey,
          context.previousProjects,
        );
      }
      notifications.show({
        color: "red",
        title: "Couldn't delete task",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
