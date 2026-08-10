import { Divider, Stack, Text } from "@mantine/core";
import type { FC } from "react";
import type { TaskDTO } from "@/main/tasks";
import { SubtasksList } from "./SubtasksList";

type SubtasksSectionProps = {
  /** Absent while the task itself hasn't been saved yet — subtasks can't be
   * added before that (SPECIFICATION.md "Детальное отображение задачи":
   * "Подзадачи в режиме создания добавить нельзя"). */
  parentTask: TaskDTO | undefined;
  onOpenSubtask: (subtask: TaskDTO) => void;
  onAddSubtask: () => void;
};

export const SubtasksSection: FC<SubtasksSectionProps> = ({
  parentTask,
  onOpenSubtask,
  onAddSubtask,
}) => {
  if (!parentTask) {
    return (
      <Stack gap="xs">
        <Divider label="Sub-tasks" labelPosition="left" />
        <Text size="sm" c="dimmed">
          Save this task first to add sub-tasks.
        </Text>
      </Stack>
    );
  }

  return (
    <SubtasksList
      parentTask={parentTask}
      onOpenSubtask={onOpenSubtask}
      onAddSubtask={onAddSubtask}
    />
  );
};
