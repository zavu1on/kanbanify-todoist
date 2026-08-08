import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { tasksListQueryKey } from "@/entities/task";
import type { TaskDTO, TasksListResult, UpdateTaskRequest } from "@/main/tasks";
import { updateTask } from "./updateTask";

type TasksPages = InfiniteData<TasksListResult>;

type UpdateTaskVariables = { taskId: string; input: UpdateTaskRequest };

/**
 * Editing a task is optimistic: the card in `queryKey`'s cache is patched
 * in place immediately, rolled back with an error notification if the API
 * call fails — same pattern as `useChangeTaskStatusMutation`. `queryKey` is
 * the caller's own list cache, same reasoning as `useCreateTaskMutation`.
 */
export const useUpdateTaskMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: UpdateTaskVariables) =>
      updateTask(taskId, input),

    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TasksPages>(queryKey);

      const patch: Partial<TaskDTO> = {
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        priority: input.priority,
        due: input.due,
        kanbanStatus: { level: input.kanbanStatus, hasConflict: false },
        labels: input.labels,
      };

      queryClient.setQueryData<TasksPages>(
        queryKey,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) =>
              page.ok
                ? {
                    ...page,
                    tasks: page.tasks.map((task) =>
                      task.id === taskId ? { ...task, ...patch } : task,
                    ),
                  }
                : page,
            ),
          },
      );

      return { previous };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed save surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, { taskId }, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't save task",
          message: result.error.message,
        });
        return;
      }

      queryClient.setQueryData<TasksPages>(
        queryKey,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) =>
              page.ok
                ? {
                    ...page,
                    tasks: page.tasks.map((task) =>
                      task.id === taskId ? result.task : task,
                    ),
                  }
                : page,
            ),
          },
      );

      // Same reasoning as `useChangeTaskStatusMutation`: mark every tasks-list
      // page stale without forcing a refetch, so the edit shows up on other
      // screens without an on-screen jump here.
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
        title: "Couldn't save task",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
