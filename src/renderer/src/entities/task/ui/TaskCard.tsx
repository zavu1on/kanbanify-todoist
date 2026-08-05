import {
  Badge,
  Card,
  Center,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { BadgeAlertIcon, ClockIcon } from "lucide-animated";
import type { FC } from "react";
import type { Task } from "@/main/tasks";
import { getDueDisplay } from "../lib/dueDate";
import {
  KANBAN_COLUMN_LABELS,
  KANBAN_STATUS_COLORS,
} from "../lib/kanbanColumns";
import { PRIORITY_MARKER_COLORS } from "../lib/priority";

type TaskCardProps = {
  task: Task;
};

export const TaskCard: FC<TaskCardProps> = ({ task }) => {
  const due = task.due ? getDueDisplay(task.due) : null;
  const priorityColor = PRIORITY_MARKER_COLORS[task.priority.level];

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap={6}>
        <Group gap={6} wrap="nowrap" align="flex-start">
          {priorityColor && (
            <Tooltip label={task.priority.level.toUpperCase()}>
              <Paper radius="xl" w={8} h={8} mt={6} bg={priorityColor} />
            </Tooltip>
          )}
          <Text size="sm" fw={500} style={{ flex: 1 }}>
            {task.title}
          </Text>
        </Group>

        {(due ||
          task.kanbanStatus.level !== "none" ||
          task.labels.length > 0) && (
          <Group gap={6}>
            {due && (
              <Badge
                size="sm"
                variant="light"
                // Red wins when a task is both overdue and due today (e.g. today
                // at a past time) — see getDueDisplay's doc comment.
                color={due.isOverdue ? "red" : due.isDueToday ? "blue" : "gray"}
                leftSection={
                  <Center>
                    <ClockIcon size={12} animateOnHover={false} />
                  </Center>
                }
              >
                {due.label}
              </Badge>
            )}

            {task.kanbanStatus.level !== "none" && (
              <Badge
                size="sm"
                variant="light"
                color={KANBAN_STATUS_COLORS[task.kanbanStatus.level]}
                rightSection={
                  task.kanbanStatus.hasConflict && (
                    <Tooltip label="Multiple kanban labels on this task — showing the rightmost column">
                      <BadgeAlertIcon size={12} animateOnHover={false} />
                    </Tooltip>
                  )
                }
              >
                {KANBAN_COLUMN_LABELS[task.kanbanStatus.level]}
              </Badge>
            )}

            {task.labels.map((label) => (
              <Badge key={label} size="sm" variant="outline" color="gray">
                {label}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </Card>
  );
};
