import dayjs from "dayjs";
import { type DueVariant, parseFilterQuery } from "@/entities/filter";
import type { TaskDTO } from "@/main/tasks";
import { getDueDisplay } from "./dueDate";

const matchesDue = (variant: DueVariant, due: TaskDTO["due"]): boolean => {
  if (variant === "no_date") return due === null;
  if (due === null) return false;

  if (variant === "next_7_days") {
    const target = due.datetime ? dayjs(due.datetime) : dayjs(due.date);
    const now = dayjs();
    return !target.isBefore(now, "day") && target.isBefore(now.add(7, "day"));
  }

  const { isOverdue, isDueToday } = getDueDisplay(due);
  if (variant === "today_overdue") return isOverdue || isDueToday;
  if (variant === "today") return isDueToday;
  return isOverdue; // "overdue"
};

/**
 * Evaluates whether `task` matches a saved filter's `query` — only the exact
 * structured project/priority/due/labels grammar `buildFilterQuery` produces
 * (see `parseFilterQuery`), not arbitrary Todoist filter syntax; that's the
 * only shape this app's own filters are ever saved in, so it's enough to
 * drive optimistic membership in `reconcileTaskInLists` without a real
 * refetch. `projectName` resolves `task.projectId` against the caller's own
 * cached project list — pass `null` when it isn't cached, which safely fails
 * a project clause instead of guessing.
 */
export const taskMatchesFilterQuery = (
  query: string,
  task: TaskDTO,
  projectName: string | null,
): boolean => {
  const fields = parseFilterQuery(query);

  const clauses: boolean[] = [];
  if (fields.projectName !== null) {
    clauses.push(fields.projectName === projectName);
  }
  if (fields.priorities.length > 0) {
    clauses.push(fields.priorities.includes(task.priority));
  }
  if (fields.due !== null) {
    clauses.push(matchesDue(fields.due, task.due));
  }
  if (fields.labels.length > 0) {
    clauses.push(fields.labels.some((label) => task.labels.includes(label)));
  }

  if (clauses.length === 0) return true;
  return fields.conjunction === "or"
    ? clauses.some(Boolean)
    : clauses.every(Boolean);
};
