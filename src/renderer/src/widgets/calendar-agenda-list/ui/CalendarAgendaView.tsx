import type { QueryKey } from "@tanstack/react-query";
import { type FC, memo, useCallback, useMemo, useState } from "react";
import { useCompleteTaskMutation } from "@/features/complete-task";
import { TaskFormModal } from "@/features/manage-task";
import type { TaskDTO } from "@/main/tasks";
import { AgendaList } from "./AgendaList";

type CalendarAgendaListProps = {
  // Dated tasks only, already sorted by due date (`tasks:listWithDueDate`).
  tasks: TaskDTO[];
  // The cache entry these tasks came from — completion and edit write their
  // optimistic updates there (see `useCompleteTaskMutation`, `TaskFormModal`).
  queryKey: QueryKey;
};

/** `@mantine/schedule`'s own `AgendaView` renders events as compact chips
 * (a color dot + one line), not full task rows — so this list is built
 * the same way as `widgets/task-list/TaskListView` instead: a `TaskCard`
 * per task, grouped under a date heading, since CALENDAR.md asks this view
 * to look like the Tasks list. */
// `memo`-ed so an unrelated `CalendarPage` re-render (e.g. the toolbar's
// `isRefetching` flicker) doesn't force a full re-render here — holds only
// because `tasks`/`queryKey` are themselves kept referentially stable
// upstream (see CalendarPage.tsx's memoized `flattenTaskPages` call).
export const CalendarAgendaView: FC<CalendarAgendaListProps> = memo(
  function CalendarAgendaView({ tasks, queryKey }) {
    const completeTaskMutation = useCompleteTaskMutation(queryKey);
    const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);

    // Stable across renders (`mutate` itself is stable per TanStack Query,
    // `tasks` stable per the note above) so `TaskCard`'s `memo` can actually
    // skip untouched cards.
    const handleComplete = useCallback(
      (taskId: string) => completeTaskMutation.mutate({ taskId }),
      [completeTaskMutation.mutate],
    );

    const handleCardClick = useCallback(
      (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (task) setEditingTask(task);
      },
      [tasks],
    );

    const groups = useMemo(() => {
      const byDate = new Map<string, TaskDTO[]>();
      for (const task of tasks) {
        const date = task.due?.date ?? "";
        const group = byDate.get(date);
        if (group) group.push(task);
        else byDate.set(date, [task]);
      }
      return [...byDate.entries()];
    }, [tasks]);

    return (
      <>
        <AgendaList
          groups={groups}
          onComplete={handleComplete}
          onCardClick={handleCardClick}
        />

        {editingTask && (
          <TaskFormModal
            opened
            onClose={() => setEditingTask(null)}
            queryKey={queryKey}
            task={editingTask}
          />
        )}
      </>
    );
  },
);
