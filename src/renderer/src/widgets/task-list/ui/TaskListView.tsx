import { Button, Stack } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { PlusIcon } from "lucide-animated";
import type { FC } from "react";
import { TaskCard } from "@/entities/task";
import { useCompleteTaskMutation } from "@/features/complete-task";
import type { TaskDTO } from "@/main/tasks";

type TaskListViewProps = {
  tasks: TaskDTO[];
  // The cache entry these tasks came from — completion writes its optimistic
  // update there (see `useCompleteTaskMutation`).
  queryKey: QueryKey;
  hideProject?: boolean;
};

export const TaskListView: FC<TaskListViewProps> = ({
  tasks,
  queryKey,
  hideProject,
}) => {
  const completeTaskMutation = useCompleteTaskMutation(queryKey);

  return (
    <Stack gap="xs">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          hideProject={hideProject}
          onComplete={(taskId) => completeTaskMutation.mutate({ taskId })}
        />
      ))}

      {/* Rendering only — task creation ships as a separate feature. */}
      <Button
        variant="subtle"
        color="gray"
        justify="flex-start"
        leftSection={<PlusIcon size={16} animateOnHover={false} />}
      >
        Add task
      </Button>
    </Stack>
  );
};
