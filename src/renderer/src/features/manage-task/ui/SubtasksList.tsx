import { Button, Divider, Stack, Text } from "@mantine/core";
import { PlusIcon } from "lucide-animated";
import type { FC } from "react";
import {
  subtasksListQueryKey,
  TaskCard,
  useSubtasksQuery,
} from "@/entities/task";
import { useCompleteTaskMutation } from "@/features/complete-task";
import type { TaskDTO } from "@/main/tasks";

type SubtasksListProps = {
  parentTask: TaskDTO;
  onOpenSubtask: (subtask: TaskDTO) => void;
  onAddSubtask: () => void;
};

export const SubtasksList: FC<SubtasksListProps> = ({
  parentTask,
  onOpenSubtask,
  onAddSubtask,
}) => {
  const queryKey = subtasksListQueryKey(parentTask.id);
  const subtasksQuery = useSubtasksQuery(parentTask.id);
  const completeSubtaskMutation = useCompleteTaskMutation(queryKey);

  const pages = subtasksQuery.data?.pages ?? [];
  const firstPage = pages[0];
  const subtasks = firstPage?.ok ? firstPage.tasks : [];

  return (
    <Stack gap="xs">
      <Divider
        label={
          subtasksQuery.isPending ? "Sub-tasks" : `Sub-tasks ${subtasks.length}`
        }
        labelPosition="left"
      />

      {subtasksQuery.isPending ? (
        <Text size="sm" c="dimmed">
          Loading...
        </Text>
      ) : firstPage && !firstPage.ok ? (
        <Text size="sm" c="red">
          {firstPage.error.message}
        </Text>
      ) : (
        subtasks.map((subtask) => (
          <TaskCard
            key={subtask.id}
            task={subtask}
            fixedHeight
            hideKanbanStatus
            onComplete={(taskId) => completeSubtaskMutation.mutate({ taskId })}
            onClick={() => onOpenSubtask(subtask)}
          />
        ))
      )}

      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<PlusIcon size={14} animateOnHover={false} />}
        onClick={onAddSubtask}
        style={{ alignSelf: "flex-start" }}
      >
        Add sub-task
      </Button>
    </Stack>
  );
};
