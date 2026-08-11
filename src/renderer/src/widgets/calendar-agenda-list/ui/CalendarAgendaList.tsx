import { Stack, Text } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC, useState } from "react";
import { TaskCard } from "@/entities/task";
import { useCompleteTaskMutation } from "@/features/complete-task";
import { TaskFormModal } from "@/features/manage-task";
import type { TaskDTO } from "@/main/tasks";

type CalendarAgendaListProps = {
  // Dated tasks only, already sorted by due date (`tasks:listWithDueDate`).
  tasks: TaskDTO[];
  // The cache entry these tasks came from — completion and edit write their
  // optimistic updates there (see `useCompleteTaskMutation`, `TaskFormModal`).
  queryKey: QueryKey;
};

/** `@mantine/schedule`'s own `AgendaView` renders events as compact chips
 * (a color dot + one line), not full task rows — so this list is built
 * the same way as `widgets/task-list/TaskListView` instead: a `TaskCard`
 * per task, grouped under a date heading, since CALENDAR.md asks this view
 * to look like the Tasks list. */
export const CalendarAgendaList: FC<CalendarAgendaListProps> = ({
  tasks,
  queryKey,
}) => {
  const completeTaskMutation = useCompleteTaskMutation(queryKey);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);

  const groups = new Map<string, TaskDTO[]>();
  for (const task of tasks) {
    const date = task.due?.date ?? "";
    const group = groups.get(date);
    if (group) group.push(task);
    else groups.set(date, [task]);
  }

  return (
    <>
      <Stack gap="lg">
        {[...groups.entries()].map(([date, dayTasks]) => (
          <Stack key={date} gap="xs">
            <Text fw={600} size="sm">
              {dayjs(date).format("dddd, MMMM D")}
            </Text>

            <Stack gap="xs">
              {dayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={(taskId) => completeTaskMutation.mutate({ taskId })}
                  onClick={() => setEditingTask(task)}
                />
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>

      {editingTask && (
        <TaskFormModal
          opened
          onClose={() => setEditingTask(null)}
          queryKey={queryKey}
          task={editingTask}
        />
      )}
    </>
  );
};
