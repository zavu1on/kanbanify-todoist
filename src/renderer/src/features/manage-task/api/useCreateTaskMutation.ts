import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { tasksListQueryKey } from "@/entities/task";
import type { CreateTaskRequest, TaskDTO, TasksListResult } from "@/main/tasks";
import { createTask } from "./createTask";

type TasksPages = InfiniteData<TasksListResult>;

/**
 * Creating a task is optimistic: a temp-id card is inserted into `queryKey`'s
 * first page immediately, swapped for the real one on success, or rolled back
 * with an error notification on failure — same pattern as
 * `useChangeTaskStatusMutation`/`useCompleteTaskMutation`. `queryKey` is the
 * caller's own list cache (the "Tasks" page, a project page, or the kanban
 * board sharing either) so the card appears on the screen the modal was
 * opened from without waiting for the IPC round trip.
 */
export const useCreateTaskMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskRequest) => createTask(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TasksPages>(queryKey);
      const tempId = `temp-${crypto.randomUUID()}`;

      const tempTask: TaskDTO = {
        id: tempId,
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        priority: input.priority,
        due: input.due,
        kanbanStatus: { level: input.kanbanStatus, hasConflict: false },
        labels: input.labels,
        checked: false,
        parentId: input.parentId,
      };

      queryClient.setQueryData<TasksPages>(queryKey, (data) => {
        if (!data) return data;
        const [firstPage, ...rest] = data.pages;
        if (!firstPage?.ok) return data;
        return {
          ...data,
          pages: [
            { ...firstPage, tasks: [tempTask, ...firstPage.tasks] },
            ...rest,
          ],
        };
      });

      return { previous, tempId };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed create surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, _input, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't add task",
          message: result.error.message,
        });
        return;
      }

      queryClient.setQueryData<TasksPages>(queryKey, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) =>
            page.ok
              ? {
                  ...page,
                  tasks: page.tasks.map((task) =>
                    task.id === context?.tempId ? result.task : task,
                  ),
                }
              : page,
          ),
        };
      });

      // Same reasoning as `useChangeTaskStatusMutation`: mark every tasks-list
      // page stale without forcing a refetch, so the new task shows up on
      // other screens (e.g. the global "Tasks" list after creating from a
      // project page) without an on-screen jump here.
      queryClient.invalidateQueries({
        queryKey: tasksListQueryKey,
        refetchType: "none",
      });
    },

    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't add task",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
