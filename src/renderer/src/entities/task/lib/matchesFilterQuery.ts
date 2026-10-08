import dayjs from "dayjs";
import {
  buildFilterTree,
  type DueVariant,
  evaluateTree,
  parseFilterQuery,
} from "@/entities/filter";
import type { TaskDTO } from "@/main/tasks";
import { getDueDisplay } from "./dueDate";

const matchesDue = (variant: DueVariant, due: TaskDTO["due"]): boolean => {
  if (variant === "no_date") return due === null;
  if (due === null) return false;

  if (variant === "next_3_days" || variant === "next_7_days") {
    const days = variant === "next_3_days" ? 3 : 7;
    const target = due.datetime ? dayjs(due.datetime) : dayjs(due.date);
    const now = dayjs();
    return (
      !target.isBefore(now, "day") && target.isBefore(now.add(days, "day"))
    );
  }

  const { isOverdue, isDueToday } = getDueDisplay(due);
  if (variant === "today_overdue") return isOverdue || isDueToday;
  return isOverdue; // "overdue"
};

/**
 * Evaluates whether `task` matches a saved filter's `query` — only the exact
 * structured project/priority/due/labels/status grammar `buildFilterQuery` produces
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

  const { tree, keys } = buildFilterTree(fields);
  if (keys.length === 0) return true;

  const matchesField = (key: (typeof keys)[number]): boolean => {
    switch (key) {
      case "project":
        return fields.projectName === projectName;
      case "priorities":
        return fields.priorities.includes(task.priority);
      case "due":
        return fields.due !== null && matchesDue(fields.due, task.due);
      case "labels":
        return fields.labels.some((label) => task.labels.includes(label));
      case "kanbanStatus":
        // Raw label, like the server's `@label` — not the resolved status.
        return (
          fields.kanbanStatus !== null &&
          task.labels.includes(fields.kanbanStatus)
        );
    }
  };

  return evaluateTree(
    tree,
    (index) => matchesField(keys[index]) !== fields.negated[keys[index]],
  );
};
