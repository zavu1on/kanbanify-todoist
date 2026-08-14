import { getDueDisplay } from "@/entities/task";
import type { TaskDTO } from "@/main/tasks";

export type TodaySplit = { overdue: TaskDTO[]; today: TaskDTO[] };

/** Splits `tasks:listToday`'s `today | overdue` result into the two list
 * sections SPECIFICATION.md "Сегодня" asks for — a task due today at an
 * already-past time is overdue (see `getDueDisplay`'s doc comment) and goes
 * to that section only, never both. */
export const splitTodayTasks = (tasks: TaskDTO[]): TodaySplit => {
  const overdue: TaskDTO[] = [];
  const today: TaskDTO[] = [];

  for (const task of tasks) {
    if (task.due && getDueDisplay(task.due).isOverdue) overdue.push(task);
    else today.push(task);
  }

  return { overdue, today };
};
