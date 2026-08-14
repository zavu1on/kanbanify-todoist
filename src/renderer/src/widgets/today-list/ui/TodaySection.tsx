import { Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import type { FC } from "react";
import { TaskCard } from "@/entities/task";
import type { TaskDTO } from "@/main/tasks";

type TodaySectionProps = {
  tasks: TaskDTO[];
  onComplete: (taskId: string) => void;
  onCardClick: (taskId: string) => void;
};

export const TodaySection: FC<TodaySectionProps> = ({
  tasks,
  onComplete,
  onCardClick,
}) => (
  <Stack gap="xs">
    <Text fw={600} size="sm">
      {dayjs().format("dddd, MMMM D")}
    </Text>

    <Stack gap="xs">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={onComplete}
          onClick={onCardClick}
        />
      ))}
    </Stack>
  </Stack>
);
