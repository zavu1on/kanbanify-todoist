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
import type { TaskDTO, TasksListResult, UpdateTaskRequest } from "@/main/tasks";
import { updateTask } from "./updateTask";

type TasksPages = InfiniteData<TasksListResult>;

type UpdateTaskVariables = {
  taskId: string;
  input: UpdateTaskRequest;
  /** The pre-patch task, straight from whichever card/frame the caller
   * already has it from — lets `onMutate` build the full patched `TaskDTO`
   * itself, and reconcile it into every cached list, not just `queryKey`'s
   * (see `reconcileTaskInLists`). */
  task: TaskDTO;
};

/**
 * Editing a task is optimistic: it's patched immediately in every
 * already-cached tasks-list it belongs in (`reconcileTaskInLists`) — not
 * just `queryKey`, the caller's own screen — inserted where it newly
 * qualifies (e.g. moved into a project page visited earlier this session),
 * dropped where it no longer does (its due date moved past today on a
 * cached Today page), and rolled back everywhere with an error notification
 * if the API call fails.
 */
export const useUpdateTaskMutation = (queryKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: UpdateTaskVariables) =>
      updateTask(taskId, input),

    onMutate: async ({ taskId, input, task }) => {
      await queryClient.cancelQueries({ queryKey: taskCountQueryKey });
      await queryClient.cancelQueries({ queryKey: projectsListQueryKey });

      const patched: TaskDTO = {
        ...task,
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        priority: input.priority,
        due: input.due,
        kanbanStatus: { level: input.kanbanStatus, hasConflict: false },
        labels: input.labels,
      };

      const listSnapshots = await reconcileTaskInLists(
        queryClient,
        patched,
        taskId,
      );

      const { previousTaskCount, previousTodayCount } = applyTaskCountDelta(
        queryClient,
        {
          total: 0,
          today:
            (isDueTodayOrOverdue(patched) ? 1 : 0) -
            (isDueTodayOrOverdue(task) ? 1 : 0),
        },
      );
      let previousProjects: ReturnType<typeof applyActiveTaskCountDelta>;
      if (task.projectId !== patched.projectId) {
        previousProjects = applyActiveTaskCountDelta(
          queryClient,
          task.projectId,
          -1,
        );
        applyActiveTaskCountDelta(queryClient, patched.projectId, 1);
      }

      return {
        listSnapshots,
        previousTaskCount,
        previousTodayCount,
        previousProjects,
      };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed save surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, { taskId }, context) => {
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
        title: "Couldn't save task",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
