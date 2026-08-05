import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { tasksListQueryKey } from "@/entities/task";
import type { KanbanStatusLevel, Task, TasksListResult } from "@/main/tasks";
import { updateTaskStatus } from "./updateTaskStatus";

type TasksPages = InfiniteData<TasksListResult>;

type ChangeTaskStatusVariables = { taskId: string; status: KanbanStatusLevel };

/**
 * Drag-and-drop between kanban columns changes status optimistically — the
 * card moves immediately in the cache, and is put back in its original
 * column with an error notification if the API call fails
 * (see SPECIFICATION.md "Kanban-режим").
 */
export const useChangeTaskStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: ChangeTaskStatusVariables) =>
      updateTaskStatus(taskId, status),

    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: tasksListQueryKey });
      const previous = queryClient.getQueryData<TasksPages>(tasksListQueryKey);

      queryClient.setQueryData<TasksPages>(
        tasksListQueryKey,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) =>
              page.ok
                ? {
                    ...page,
                    tasks: page.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            // IPC data never carries class methods, so `KanbanStatus`
                            // is really just `{ level, hasConflict }` on this side —
                            // this stand-in matches what a real refetch would deliver.
                            kanbanStatus: {
                              level: status,
                              hasConflict: false,
                            } as Task["kanbanStatus"],
                          }
                        : task,
                    ),
                  }
                : page,
            ),
          },
      );

      return { previous };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed move surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, _variables, context) => {
      if (result.ok) return;

      if (context?.previous) {
        queryClient.setQueryData(tasksListQueryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't move task",
        message: result.error.message,
      });
    },
  });
};
