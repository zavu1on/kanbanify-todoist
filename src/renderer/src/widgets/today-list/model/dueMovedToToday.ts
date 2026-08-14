import dayjs from "dayjs";
import type { TaskDTO } from "@/main/tasks";

/** Moves a task's due date to today, keeping its time-of-day if it had one —
 * same "shift the date, preserve the time" rule `dueAfterDrop` uses for a
 * Calendar drag, applied here to the "Move all to today" bulk action
 * (SPECIFICATION.md "Сегодня"). */
export const dueMovedToToday = (
  due: NonNullable<TaskDTO["due"]>,
): NonNullable<TaskDTO["due"]> => {
  const today = dayjs();
  return {
    date: today.format("YYYY-MM-DD"),
    datetime: due.datetime
      ? dayjs(due.datetime)
          .year(today.year())
          .month(today.month())
          .date(today.date())
          .toISOString()
      : null,
  };
};
