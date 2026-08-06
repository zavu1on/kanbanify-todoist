import { Button, Stack } from "@mantine/core";
import { PlusIcon } from "lucide-animated";
import type { FC } from "react";
import { TaskCard } from "@/entities/task";
import type { Task } from "@/main/tasks";

type TaskListViewProps = {
  tasks: Task[];
  hideProject?: boolean;
};

export const TaskListView: FC<TaskListViewProps> = ({ tasks, hideProject }) => {
  return (
    <Stack gap="xs">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} hideProject={hideProject} />
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
