import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import type { FC } from "react";
import { TaskCard } from "@/entities/task";
import type { TaskDTO } from "@/main/tasks";

type OverdueSectionProps = {
  tasks: TaskDTO[];
  onComplete: (taskId: string) => void;
  onCardClick: (taskId: string) => void;
  onMoveAllClick: () => void;
};

export const OverdueSection: FC<OverdueSectionProps> = ({
  tasks,
  onComplete,
  onCardClick,
  onMoveAllClick,
}) => (
  <Stack gap="xs">
    <Group justify="space-between">
      <Group gap={6}>
        <Text fw={600} size="sm">
          Overdue
        </Text>
        <Badge size="sm" variant="light" color="red" circle>
          {tasks.length}
        </Badge>
      </Group>

      <Button size="xs" variant="light" onClick={onMoveAllClick}>
        Move all to today
      </Button>
    </Group>

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
