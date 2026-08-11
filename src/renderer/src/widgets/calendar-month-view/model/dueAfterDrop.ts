import dayjs from "dayjs";
import type { TaskDTO } from "@/main/tasks";

/** `onEventDrop` gives the event's new start already recalculated in local
 * time by `@mantine/schedule` (date changed, time-of-day preserved) — this
 * only has to decide whether the task keeps a time-of-day or stays
 * date-only, mirroring the encoding `toScheduleEvents` used to build the
 * event in the first place. */
export const dueAfterDrop = (
  task: TaskDTO,
  newStart: string,
): NonNullable<TaskDTO["due"]> => ({
  date: dayjs(newStart).format("YYYY-MM-DD"),
  datetime: task.due?.datetime ? dayjs(newStart).toISOString() : null,
});
