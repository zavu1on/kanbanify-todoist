import type { ScheduleEventData } from "@mantine/schedule";
import dayjs from "dayjs";
import {
  getDueDisplay,
  KANBAN_STATUS_COLORS,
  PRIORITY_MARKER_COLORS,
} from "@/entities/task";
import type { TaskDTO } from "@/main/tasks";

export type TaskEventPayload = { task: TaskDTO };

/** `tasks:listWithDueDate` only ever returns dated tasks, but `TaskDTO.due`
 * stays nullable in the shared contract — narrow here rather than asserting. */
const hasDue = (
  task: TaskDTO,
): task is TaskDTO & { due: NonNullable<TaskDTO["due"]> } => task.due !== null;

/** Same precedence a `TaskCard`'s badges would show, collapsed into one
 * color since the month grid's event chip has room for a single hue —
 * overdue first, then kanban status, then priority. */
const eventColor = (
  task: TaskDTO & { due: NonNullable<TaskDTO["due"]> },
): string => {
  if (getDueDisplay(task.due).isOverdue) return "red";
  const kanbanLevel = task.kanbanStatus.level;
  if (kanbanLevel !== "none") return KANBAN_STATUS_COLORS[kanbanLevel];
  return PRIORITY_MARKER_COLORS[task.priority] ?? "gray";
};

/** Maps tasks to `@mantine/schedule` events (this app never uses `duration`,
 * a paid-tier field, so a timed task is a zero-length instant at its due
 * time). A date-only due needs the package's all-day encoding — `start` at
 * that day's midnight, `end` at the *next* day's midnight — not
 * `start === end`: the library treats an event whose `end` lands exactly on
 * midnight as an exclusive multi-day boundary and subtracts a day from it,
 * which would turn a same-instant `start`/`end` into an inverted (end before
 * start) range and drop the event from the month grid entirely. */
export const toScheduleEvents = (
  tasks: TaskDTO[],
): ScheduleEventData<TaskEventPayload>[] =>
  tasks.filter(hasDue).map((task) => {
    const start = task.due.datetime ?? `${task.due.date} 00:00:00`;
    const end = task.due.datetime
      ? start
      : `${dayjs(task.due.date).add(1, "day").format("YYYY-MM-DD")} 00:00:00`;
    return {
      id: task.id,
      title: task.title,
      start,
      end,
      color: eventColor(task),
      variant: "light",
      payload: { task },
    };
  });
