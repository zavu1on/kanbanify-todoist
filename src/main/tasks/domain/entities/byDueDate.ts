import type { Task } from "./Task";

/** `null` sorts last: tasks without a due date go after all dated ones. */
const dueTimestamp = (task: Task): number | null =>
  task.due ? new Date(task.due.datetime ?? task.due.date).getTime() : null;

// ponytail: sorts within each fetched page only, not across the full pagination
// cursor — a true global sort would mean fetching all pages upfront, which
// defeats the point of "Load more". Good enough while lists stay near one page.
/** Shared by `ListTasksUseCase` and `ListTasksWithDueDateUseCase`. */
export const byDueDate = (a: Task, b: Task): number => {
  const aTime = dueTimestamp(a);
  const bTime = dueTimestamp(b);
  if (aTime === null) return bTime === null ? 0 : 1;
  if (bTime === null) return -1;
  return aTime - bTime;
};
