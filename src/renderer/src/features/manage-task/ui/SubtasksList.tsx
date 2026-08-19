import { Box, Button, Group, Progress, Stack, Text } from "@mantine/core";
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
  const doneCount = subtasks.filter((subtask) => subtask.checked).length;

  return (
    <Stack gap="xs">
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={650} tt="uppercase" c="dimmed">
            Sub-tasks
          </Text>
          {!subtasksQuery.isPending && subtasks.length > 0 && (
            <Text size="xs" c="dimmed">
              {doneCount}/{subtasks.length} done
            </Text>
          )}
        </Group>
        {!subtasksQuery.isPending && subtasks.length > 0 && (
          <Progress
            size={3}
            value={(doneCount / subtasks.length) * 100}
            color="myColor"
          />
        )}
      </Box>

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
            variant="compact"
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
