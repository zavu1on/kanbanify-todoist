import { Divider, Stack, Text } from "@mantine/core";
import { type FC, memo } from "react";
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

/** `memo`d so `TaskFormFrame` re-rendering while typing the title (see
 * `useQuickAddTitleSync`'s `rawTitle` state) doesn't also re-run this
 * section's own subtasks query. */
const SubtasksSectionComponent: FC<SubtasksSectionProps> = ({
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

export const SubtasksSection = memo(SubtasksSectionComponent);
