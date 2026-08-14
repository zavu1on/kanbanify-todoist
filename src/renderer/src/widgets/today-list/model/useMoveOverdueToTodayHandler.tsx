import { Button, Group, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { QueryKey } from "@tanstack/react-query";
import { useCallback } from "react";
import { useUpdateTaskMutation } from "@/features/manage-task";
import type { TaskDTO, UpdateTaskRequest } from "@/main/tasks";
import { dueMovedToToday } from "./dueMovedToToday";

const toUpdateRequest = (
  task: TaskDTO,
  due: TaskDTO["due"],
): UpdateTaskRequest => ({
  title: task.title,
  description: task.description,
  projectId: task.projectId,
  priority: task.priority,
  due,
  kanbanStatus: task.kanbanStatus.level,
  labels: task.labels,
});

/**
 * "Move all to today" (SPECIFICATION.md "Сегодня"): reschedules every
 * overdue task via the same optimistic `useUpdateTaskMutation` a manual edit
 * uses, then shows a 5-second notification that reverses every task back to
 * its original due date if "Undo" is clicked before it closes.
 */
export const useMoveOverdueToTodayHandler = (queryKey: QueryKey) => {
  const updateTaskMutation = useUpdateTaskMutation(queryKey);
  const { mutate } = updateTaskMutation;

  return useCallback(
    (overdueTasks: TaskDTO[]) => {
      const originalDueById = new Map(
        overdueTasks.map((task) => [task.id, task.due]),
      );

      for (const task of overdueTasks) {
        if (!task.due) continue;
        mutate({
          taskId: task.id,
          input: toUpdateRequest(task, dueMovedToToday(task.due)),
        });
      }

      const notificationId = `move-overdue-to-today-${Date.now()}`;
      const undo = () => {
        for (const task of overdueTasks) {
          mutate({
            taskId: task.id,
            input: toUpdateRequest(task, originalDueById.get(task.id) ?? null),
          });
        }
        notifications.hide(notificationId);
      };

      notifications.show({
        id: notificationId,
        color: "blue",
        title: "Moved to today",
        message: (
          <Group justify="space-between" wrap="nowrap" gap="md">
            <Text size="sm">
              {overdueTasks.length} task{overdueTasks.length === 1 ? "" : "s"}{" "}
              moved to today
            </Text>
            <Button size="xs" variant="subtle" onClick={undo}>
              Undo
            </Button>
          </Group>
        ),
        autoClose: 5000,
      });
    },
    [mutate],
  );
};
