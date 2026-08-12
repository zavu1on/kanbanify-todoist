import { Stack } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { type FC, useRef } from "react";
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

  return (
    <Stack gap="xs">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          hideProject={hideProject}
          onComplete={(taskId) => completeTaskMutation.mutate({ taskId })}
          onClick={() => formControlsRef.current?.openEdit(task)}
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
