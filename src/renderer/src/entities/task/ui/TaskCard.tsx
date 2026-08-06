import { Badge, Card, Group, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { BadgeAlertIcon, ClockIcon } from "lucide-animated";
import type { FC } from "react";
import { useProjectsQuery } from "@/entities/project";
import type { Task } from "@/main/tasks";
import { getDueDisplay } from "../lib/dueDate";
import {
  KANBAN_COLUMN_LABELS,
  KANBAN_STATUS_COLORS,
} from "../lib/kanbanColumns";
import { PRIORITY_MARKER_COLORS } from "../lib/priority";

type TaskCardProps = {
  task: Task;
  // The kanban board already conveys status via the column — pass this to
  // drop the redundant status badge there.
  hideKanbanStatus?: boolean;
  // Every card on a project's page belongs to that same project — pass this
  // there to drop the redundant project chip.
  hideProject?: boolean;
};

export const TaskCard: FC<TaskCardProps> = ({
  task,
  hideKanbanStatus,
  hideProject,
}) => {
  const due = task.due ? getDueDisplay(task.due) : null;
  const priorityColor = PRIORITY_MARKER_COLORS[task.priority.level];
  const showKanbanStatus =
    !hideKanbanStatus && task.kanbanStatus.level !== "none";

  const projectsQuery = useProjectsQuery();
  const project = projectsQuery.data?.ok
    ? projectsQuery.data.projects.find((p) => p.id === task.projectId)
    : undefined;
  // Cards inside Inbox never show a project chip (SPECIFICATION.md "Карточка задачи").
  const showProject = !hideProject && project && !project.isInboxProject;

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

        {(due || showKanbanStatus || showProject || task.labels.length > 0) && (
          <Group gap={6}>
            {due && (
              <Badge
                size="sm"
                variant="light"
                // Red wins when a task is both overdue and due today (e.g. today
                // at a past time) — see getDueDisplay's doc comment.
                color={due.isOverdue ? "red" : due.isDueToday ? "blue" : "gray"}
                leftSection={
                  <ClockIcon
                    size={12}
                    animateOnHover={false}
                    style={{ display: "flex" }}
                  />
                }
              >
                {due.label}
              </Badge>
            )}

            {showKanbanStatus && (
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

            {showProject && (
              <Badge size="sm" variant="dot" color="gray">
                #{project.name}
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
