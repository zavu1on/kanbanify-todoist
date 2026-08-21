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
  reconcileTaskInLists,
  restoreTaskListSnapshots,
  taskCountQueryKey,
  tasksListQueryKey,
  todayCountQueryKey,
} from "@/entities/task";
import type { CreateTaskRequest, TaskDTO, TasksListResult } from "@/main/tasks";
import { createTask } from "./createTask";

type TasksPages = InfiniteData<TasksListResult>;

/**
 * Creating a task is optimistic: a temp-id card is inserted immediately into
 * every already-cached tasks-list it belongs in (`reconcileTaskInLists`) —
 * not just `queryKey`, the caller's own screen — so e.g. creating a task for
 * a project from the sidebar while on Today shows it on that project's page
 * too, the moment you navigate there, without waiting for a refetch. Swapped
 * for the real task on success (in `queryKey` only — every other reconciled
 * list already gets invalidated below, and picks up the real task on its own
 * next mount/refetch), or rolled back everywhere with an error notification
 * on failure.
 */
export const useCreateTaskMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskRequest) => createTask(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: taskCountQueryKey });
      await queryClient.cancelQueries({ queryKey: projectsListQueryKey });
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

      const listSnapshots = await reconcileTaskInLists(queryClient, tempTask);

      // A new task always counts toward the total/its project — both include
      // subtasks (see `CountUnfinishedTasksUseCase`/`countActiveTasksInProject`)
      // — but only toward Today if it actually qualifies for that filter.
      const { previousTaskCount, previousTodayCount } = applyTaskCountDelta(
        queryClient,
        { total: 1, today: isDueTodayOrOverdue(tempTask) ? 1 : 0 },
      );
      const previousProjects = applyActiveTaskCountDelta(
        queryClient,
        tempTask.projectId,
        1,
      );

      return {
        listSnapshots,
        tempId,
        previousTaskCount,
        previousTodayCount,
        previousProjects,
      };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed create surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, _input, context) => {
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

      // Unlike `useChangeTaskStatusMutation`'s drag-and-drop case, a single
      // create has no rapid-fire jump risk, so refetch every other active
      // tasks-list page immediately (e.g. Today, if it's mounted and the
      // task's due date is today) instead of waiting for its next mount.
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
      // A new task changes its project's `activeTaskCount` badge in the sidebar.
      queryClient.invalidateQueries({
        queryKey: projectsListQueryKey,
        refetchType: "active",
      });
    },

    onError: (_error, _input, context) => {
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
        title: "Couldn't add task",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
