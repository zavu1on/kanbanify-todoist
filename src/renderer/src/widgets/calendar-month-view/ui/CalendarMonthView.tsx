import {
  type DayOfWeek,
  MonthView,
  type ScheduleEventData,
} from "@mantine/schedule";
import type { QueryKey } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC, useState } from "react";
import {
  type TaskFormDefaults,
  TaskFormModal,
  useUpdateTaskMutation,
} from "@/features/manage-task";
import type { TaskDTO } from "@/main/tasks";
import { dueAfterDrop } from "../model/dueAfterDrop";
import {
  type TaskEventPayload,
  toScheduleEvents,
} from "../model/toScheduleEvents";
import { CalendarChip } from "./CalendarChip";

type CalendarMonthViewProps = {
  // Dated tasks only, already sorted by due date (`tasks:listWithDueDate`).
  tasks: TaskDTO[];
  // The cache entry these tasks came from — add/edit write their optimistic
  // updates there (see `TaskFormModal`).
  queryKey: QueryKey;
  weekStartsOn: DayOfWeek;
};

/** The month grid is `@mantine/schedule`'s `MonthView` (CALENDAR.md). No
 * custom day-overflow popup, per this feature's brief: the native
 * `maxEventsPerDay`/`moreEventsProps` "+more" already covers overflow. */
export const CalendarMonthView: FC<CalendarMonthViewProps> = ({
  tasks,
  queryKey,
  weekStartsOn,
}) => {
  const [date, setDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [createDefaults, setCreateDefaults] = useState<TaskFormDefaults | null>(
    null,
  );
  const updateTaskMutation = useUpdateTaskMutation(queryKey);

  const openCreateOnDay = (day: string) => {
    setCreateDefaults({ due: { date: day, datetime: null } });
  };

  const changeTaskDeadline = (newStart: string, event: ScheduleEventData) => {
    const task = (event.payload as TaskEventPayload | undefined)?.task;
    if (!task) return;

    updateTaskMutation.mutate({
      taskId: task.id,
      input: {
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        priority: task.priority,
        due: dueAfterDrop(task, newStart),
        kanbanStatus: task.kanbanStatus.level,
        labels: task.labels,
      },
    });
  };

  return (
    <>
      <MonthView
        date={date}
        maxEventsPerDay={3}
        onDateChange={setDate}
        events={toScheduleEvents(tasks)}
        firstDayOfWeek={weekStartsOn}
        // `@mantine/schedule` shrinks event text via a container query once
        // a day's event row gets short, regardless of `theme.scale` —
        // rendering the title in a `Text` with an explicit size sidesteps
        // that. The event row is a fixed ~22px tall, so `lh={1}` keeps the
        // line inside it instead of clipping against the pill's padding.
        renderEventBody={(event) => <CalendarChip event={event} />}
        // This app has no day/week/year schedule views to switch to.
        viewSelectProps={{ views: [] }}
        onDayClick={openCreateOnDay}
        onEventClick={(event: ScheduleEventData) => {
          const payload = event.payload as TaskEventPayload | undefined;
          if (payload) setEditingTask(payload.task);
        }}
        // Dragging an event to another day changes its due date — routed
        // through the same `updateTask` mutation the edit form uses, no
        // separate IPC channel for this.
        withEventsDragAndDrop
        onEventDrop={({ newStart, event }) =>
          changeTaskDeadline(newStart, event)
        }
      />

      {(editingTask || createDefaults !== null) && (
        <TaskFormModal
          opened
          onClose={() => {
            setEditingTask(null);
            setCreateDefaults(null);
          }}
          queryKey={queryKey}
          task={editingTask ?? undefined}
          defaults={createDefaults ?? undefined}
        />
      )}
    </>
  );
};
