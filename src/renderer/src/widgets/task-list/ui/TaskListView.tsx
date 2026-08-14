import { Stack } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { type FC, useCallback, useRef } from "react";
import { TaskCard } from "@/entities/task";
import { useCompleteTaskMutation } from "@/features/complete-task";
import type { TaskDTO } from "@/main/tasks";
import {
  TaskFormControls,
  type TaskFormControlsHandle,
} from "./TaskFormControls";

type TaskListViewProps = {
  tasks: TaskDTO[];
  // The cache entry these tasks came from — completion and add/edit write
  // their optimistic updates there (see `useCompleteTaskMutation`,
  // `TaskFormModal`).
  queryKey: QueryKey;
  hideProject?: boolean;
  // Pre-fills the "Add task" modal's project (see SPECIFICATION.md "Добавление
  // задачи") — absent on the global "Tasks" page, set on a project's page.
  projectId?: string;
};

export const TaskListView: FC<TaskListViewProps> = ({
  tasks,
  queryKey,
  hideProject,
  projectId,
}) => {
  const completeTaskMutation = useCompleteTaskMutation(queryKey);
  const formControlsRef = useRef<TaskFormControlsHandle>(null);

  // Stable across renders (`mutate` itself is stable per TanStack Query) so
  // `TaskCard`'s `memo` can actually skip untouched cards — see
  // handleCardClick below for why `tasks` isn't a dependency here.
  const handleComplete = useCallback(
    (taskId: string) => completeTaskMutation.mutate({ taskId }),
    [completeTaskMutation.mutate],
  );

  // Read through a ref instead of closing over `tasks` directly — `tasks` is
  // a fresh array on every parent render (see useTasksQuery.ts), so a
  // `useCallback` depending on it would defeat the memoization below just as
  // much as the inline arrow it replaces.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const handleCardClick = useCallback((taskId: string) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (task) formControlsRef.current?.openEdit(task);
  }, []);

  return (
    <Stack gap="xs">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          hideProject={hideProject}
          onComplete={handleComplete}
          onClick={handleCardClick}
        />
      ))}

      <TaskFormControls
        ref={formControlsRef}
        queryKey={queryKey}
        projectId={projectId}
      />
    </Stack>
  );
};
