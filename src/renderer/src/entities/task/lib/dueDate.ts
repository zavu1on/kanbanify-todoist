import dayjs from "dayjs";
import type { TaskDTO } from "@/main/tasks";

export type DueDisplay = {
  label: string;
  isOverdue: boolean;
  isDueToday: boolean;
  // Whole days between today and the due date, only meaningful when
  // `isOverdue` — 0 covers "overdue today at a past time", where the card
  // shows the plain label instead of a day count (see `TaskCard`).
  daysOverdue: number;
};

/** Text/icon colors for the due-date meta line — red wins when a task is
 * both overdue and due today (a past time today), same precedence
 * `getDueDisplay`'s doc comment describes. */
export const DUE_STATE_COLORS = {
  overdue: "#c93a3a",
  today: "#2f6fb3",
};

type TaskDue = NonNullable<TaskDTO["due"]>;

/**
 * Mirrors the "просрочено" rule from SPECIFICATION.md ("Срок"): a task is
 * overdue when its due date is before today, or — once a time is set —
 * before the current moment. A task due today at a past time therefore
 * matches both `isOverdue` and `isDueToday` at once; this app doesn't dedupe
 * that here (list grouping into separate "Overdue"/"Today" sections is a
 * concern for the pages that need it), it just reports both flags and lets
 * the card decide which highlight wins.
 */
export const getDueDisplay = (due: TaskDue): DueDisplay => {
  const now = dayjs();
  const target = due.datetime ? dayjs(due.datetime) : dayjs(due.date);

  const isOverdue = due.datetime
    ? target.isBefore(now)
    : target.isBefore(now, "day");
  const isDueToday = target.isSame(now, "day");
  const daysOverdue = isOverdue
    ? now.startOf("day").diff(target.startOf("day"), "day")
    : 0;

  return {
    label: formatDueLabel(due, target, now),
    isOverdue,
    isDueToday,
    daysOverdue,
  };
};

const formatDueLabel = (
  due: TaskDue,
  target: dayjs.Dayjs,
  now: dayjs.Dayjs,
): string => {
  const datePart = target.isSame(now, "day")
    ? "Today"
    : target.isSame(now.add(1, "day"), "day")
      ? "Tomorrow"
      : target.format(target.isSame(now, "year") ? "MMM D" : "MMM D, YYYY");

  return due.datetime ? `${datePart}, ${target.format("HH:mm")}` : datePart;
};
