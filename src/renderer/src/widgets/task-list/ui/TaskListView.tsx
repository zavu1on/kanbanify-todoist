import { Button, Stack } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { PlusIcon } from "lucide-animated";
import { type FC, useState } from "react";
import { TaskCard } from "@/entities/task";
import { useCompleteTaskMutation } from "@/features/complete-task";
import { TaskFormModal } from "@/features/manage-task";
import type { TaskDTO } from "@/main/tasks";

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
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Stack gap="xs">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          hideProject={hideProject}
          onComplete={(taskId) => completeTaskMutation.mutate({ taskId })}
          onClick={() => setEditingTask(task)}
        />
      ))}

      <Button
        variant="subtle"
        color="gray"
        justify="flex-start"
        leftSection={<PlusIcon size={16} animateOnHover={false} />}
        onClick={() => setIsCreateOpen(true)}
      >
        Add task
      </Button>

      {/* Mounted only while open — a fresh instance each time means the
          form always starts blank and `useForm`'s initialValues pick up
          the current `defaults` instead of whatever they were on first
          mount (see `Sidebar`'s "New task" modal). */}
      {(editingTask || isCreateOpen) && (
        <TaskFormModal
          opened
          onClose={() => {
            setEditingTask(null);
            setIsCreateOpen(false);
          }}
          queryKey={queryKey}
          task={editingTask ?? undefined}
          defaults={{ projectId }}
        />
      )}
    </Stack>
  );
};
