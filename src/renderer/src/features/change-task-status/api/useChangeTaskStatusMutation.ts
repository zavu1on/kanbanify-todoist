import { notifications } from "@mantine/notifications";
import {
  type InfiniteData,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  reconcileTaskInLists,
  restoreTaskListSnapshots,
  tasksListQueryKey,
} from "@/entities/task";
import type { KanbanStatusLevel, TaskDTO, TasksListResult } from "@/main/tasks";
import { updateTaskStatus } from "./updateTaskStatus";

type TasksPages = InfiniteData<TasksListResult>;

type ChangeTaskStatusVariables = { taskId: string; status: KanbanStatusLevel };

/**
 * Drag-and-drop between kanban columns changes status optimistically — the
 * card moves immediately in every already-cached tasks-list it's part of
 * (`reconcileTaskInLists`), not just `queryKey`'s (the caller's own board),
 * so e.g. a status change made on a project's kanban board also shows up on
 * the global "Tasks" board if that page was visited earlier this session —
 * and is put back everywhere with an error notification if the API call
 * fails (see SPECIFICATION.md "Kanban-режим"). Status never changes which
 * list a task belongs to (`belongsToList` doesn't look at `kanbanStatus`),
 * so this only ever patches an existing card, never inserts or removes one.
 */
export const useChangeTaskStatusMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: ChangeTaskStatusVariables) =>
      updateTaskStatus(taskId, status),

    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TasksPages>(queryKey);
      const task = previous?.pages
        .flatMap((page) => (page.ok ? page.tasks : []))
        .find((t) => t.id === taskId);

      if (!task) return {};

      const patched: TaskDTO = {
        ...task,
        // A real refetch would resolve any conflict server-side — an
        // optimistic move always lands with none, since the task hasn't
        // actually been touched outside this app.
        kanbanStatus: { level: status, hasConflict: false },
      };

      const listSnapshots = await reconcileTaskInLists(
        queryClient,
        patched,
        taskId,
      );

      return { listSnapshots };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed move normally surfaces here as
    // `result.ok === false`, not `onError` — `onError` below only covers an
    // actual thrown exception (e.g. a broken IPC channel).
    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.listSnapshots) {
          restoreTaskListSnapshots(queryClient, context.listSnapshots);
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
      // a move on a project's page). `refetchType: "none"` only marks them
      // stale instead of refetching now — the query on screen already has the
      // optimistic write from `onMutate`, and forcing a refetch here is what
      // caused visual jumps during fast drag-and-drop (invalidated queries
      // refetch on their next mount regardless of `staleTime`).
      queryClient.invalidateQueries({
        queryKey: tasksListQueryKey,
        refetchType: "none",
      });
    },

    onError: (_error, _variables, context) => {
      if (context?.listSnapshots) {
        restoreTaskListSnapshots(queryClient, context.listSnapshots);
      }
      notifications.show({
        color: "red",
        title: "Couldn't move task",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
