import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { tasksListQueryKey } from "@/entities/task";
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
      const previous = queryClient.getQueryData<TasksPages>(queryKey);

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

      return { previous };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed completion surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't complete task",
          message: result.error.message,
        });
        return;
      }

      // Same reasoning as `useChangeTaskStatusMutation`: mark every tasks-list
      // page stale without forcing a refetch, so the change shows up on other
      // screens without an on-screen jump here (the cache on screen already
      // has the optimistic removal from `onMutate`).
      queryClient.invalidateQueries({
        queryKey: tasksListQueryKey,
        refetchType: "none",
      });
    },
  });
};
