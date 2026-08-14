import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { taskCountQueryKey, tasksListQueryKey } from "@/entities/task";
import { projectsListQueryKey } from "@/entities/project";
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

      // Unlike `useChangeTaskStatusMutation`'s drag-and-drop case, a single
      // edit has no rapid-fire jump risk, so refetch every other active
      // tasks-list page immediately (e.g. Today, if it's mounted and the
      // task's due date moved to/from today) instead of waiting for its
      // next mount.
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
      // An edit can move the task to a different project, shifting the
      // `activeTaskCount` badge for both the old and new project.
      queryClient.invalidateQueries({
        queryKey: projectsListQueryKey,
        refetchType: "active",
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
