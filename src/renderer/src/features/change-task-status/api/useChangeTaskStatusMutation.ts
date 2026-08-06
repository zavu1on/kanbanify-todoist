import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { tasksListQueryKey } from "@/entities/task";
import type { KanbanStatusLevel, TaskDTO, TasksListResult } from "@/main/tasks";
import { updateTaskStatus } from "./updateTaskStatus";

type TasksPages = InfiniteData<TasksListResult>;

type ChangeTaskStatusVariables = { taskId: string; status: KanbanStatusLevel };

/**
 * Drag-and-drop between kanban columns changes status optimistically — the
 * card moves immediately in the cache, and is put back in its original
 * column with an error notification if the API call fails
 * (see SPECIFICATION.md "Kanban-режим"). `queryKey` is the caller's own list
 * cache (`tasksListQueryKey` on the "Tasks" page, `projectTasksListQueryKey`
 * on a project's page) — hardcoding the former here would silently no-op the
 * optimistic update on a project page instead of writing to the cache that's
 * actually on screen.
 */
export const useChangeTaskStatusMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: ChangeTaskStatusVariables) =>
      updateTaskStatus(taskId, status),

    onMutate: async ({ taskId, status }) => {
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
                    tasks: page.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            // A real refetch would resolve any conflict server-side —
                            // an optimistic move always lands with none, since the
                            // task hasn't actually been touched outside this app.
                            kanbanStatus: {
                              level: status,
                              hasConflict: false,
                            } as TaskDTO["kanbanStatus"],
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
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't move task",
          message: result.error.message,
        });
        return;
      }

      // `queryKey` only covers the page the drag happened on — invalidate every
      // tasks-list page (fuzzy match on the shared `tasksListQueryKey` prefix,
      // see FRONTEND_CODE_STYLE_GUIDE.md "Загрузка данных и состояние") so the
      // status change shows up elsewhere (e.g. the global "Tasks" screen after
      // a move on a project's page) without waiting out `staleTime`.
      queryClient.invalidateQueries({ queryKey: tasksListQueryKey });
    },
  });
};
