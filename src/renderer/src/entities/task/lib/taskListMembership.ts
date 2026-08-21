import type { QueryKey } from "@tanstack/react-query";
import type { TaskDTO } from "@/main/tasks";
import { getDueDisplay } from "./dueDate";

/**
 * Whether `task` currently belongs in the Today list/count — mirrors the
 * backend's own `(today | overdue) & !subtask` filter (`TODAY_FILTER_QUERY`
 * in `ListTodayTasksUseCase.ts`), so the renderer's optimistic cache writes
 * never drift from what a real refetch of the same filter would show.
 */
export const isDueTodayOrOverdue = (task: TaskDTO): boolean => {
  if (task.parentId) return false;
  if (!task.due) return false;
  const { isOverdue, isDueToday } = getDueDisplay(task.due);
  return isOverdue || isDueToday;
};

/**
 * Whether `task` belongs in the tasks-list cache identified by `queryKey` —
 * shared by every optimistic write that can move a task in or out of a list
 * (a create, or an update's due-date/project change): pushing a task's due
 * date past today on the Today page (`todayTasksListQueryKey`,
 * `["tasks","list","today"]`), moving it in or out of the project a project
 * page (`projectTasksListQueryKey`) is scoped to, giving/clearing a due date
 * on the Calendar page (`calendarTasksListQueryKey`, which shows every task
 * with a due date), or a subtasks list (`subtasksListQueryKey`) only ever
 * showing one parent's direct children. The unscoped "Tasks" page shows
 * every task regardless of due date/project, so it falls through to `true`.
 */
export const belongsToList = (queryKey: QueryKey, task: TaskDTO): boolean => {
  if (queryKey[2] === "today") {
    return isDueTodayOrOverdue(task);
  }
  if (queryKey[2] === "project") {
    return task.projectId === queryKey[3];
  }
  if (queryKey[2] === "calendar") {
    return task.due !== null;
  }
  if (queryKey[2] === "subtasks") {
    return task.parentId === queryKey[3];
  }
  return true;
};
