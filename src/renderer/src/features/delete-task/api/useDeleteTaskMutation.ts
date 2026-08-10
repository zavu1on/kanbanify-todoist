import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { tasksListQueryKey } from "@/entities/task";
import type { TasksListResult } from "@/main/tasks";
import { deleteTask } from "./deleteTask";

type TasksPages = InfiniteData<TasksListResult>;

type DeleteTaskVariables = { taskId: string };

/**
 * Deleting a task from its detail modal is optimistic — the card is removed
 * from `queryKey`'s cache immediately (the modal is already closed by the
 * caller by this point) and put back with an error notification if the API
 * call fails. `queryKey` is the caller's own list cache, same reasoning as
 * `useCompleteTaskMutation`, whose optimistic-removal pattern this mirrors.
 */
export const useDeleteTaskMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: DeleteTaskVariables) => deleteTask(taskId),

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
    // "IPC-контракт"), so a failed delete surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't delete task",
          message: result.error.message,
        });
        return;
      }

      // Same reasoning as `useCompleteTaskMutation`: mark every tasks-list
      // page stale without forcing a refetch, so the deletion shows up on
      // other screens without an on-screen jump here (the cache on screen
      // already has the optimistic removal from `onMutate`).
      queryClient.invalidateQueries({
        queryKey: tasksListQueryKey,
        refetchType: "none",
      });
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't delete task",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
