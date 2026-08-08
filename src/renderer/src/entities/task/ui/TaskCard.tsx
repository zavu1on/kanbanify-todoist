import {
  Badge,
  Card,
  Checkbox,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
  Transition,
} from "@mantine/core";
import { BadgeAlertIcon, ClockIcon } from "lucide-animated";
import type { FC } from "react";
import { useState } from "react";
import { useProjectsQuery } from "@/entities/project";
import type { TaskDTO } from "@/main/tasks";
import { getDueDisplay } from "../lib/dueDate";
import {
  KANBAN_COLUMN_LABELS,
  KANBAN_STATUS_COLORS,
} from "../lib/kanbanColumns";
import { PRIORITY_MARKER_COLORS } from "../lib/priority";

type TaskCardProps = {
  task: TaskDTO;
  // The kanban board already conveys status via the column — pass this to
  // drop the redundant status badge there.
  hideKanbanStatus?: boolean;
  // Every card on a project's page belongs to that same project — pass this
  // there to drop the redundant project chip.
  hideProject?: boolean;
  // Omitted where completing doesn't make sense (e.g. the kanban drag preview
  // in `DragOverlay`, see TaskBoard.tsx) — the checkbox itself only renders
  // when this is passed.
  onComplete?: (taskId: string) => void;
  // Opens the task detail modal (SPECIFICATION.md "Карточка задачи": "Клик по
  // карточке открывает Детальное отображение задачи"). Omitted for the kanban
  // drag preview, same reasoning as `onComplete`.
  onClick?: () => void;
};

export const TaskCard: FC<TaskCardProps> = ({
  task,
  hideKanbanStatus,
  hideProject,
  onComplete,
  onClick,
}) => {
  // Lets the exit animation play before the task actually leaves the list —
  // `onComplete` (the optimistic-removal mutation) fires from `onExited`,
  // once the card has visually finished disappearing.
  const [completing, setCompleting] = useState(false);

  const due = task.due ? getDueDisplay(task.due) : null;
  const priorityColor = PRIORITY_MARKER_COLORS[task.priority];
  const kanbanStatusLevel = task.kanbanStatus.level;
  const showKanbanStatus = !hideKanbanStatus && kanbanStatusLevel !== "none";

  const projectsQuery = useProjectsQuery();
  const project = projectsQuery.data?.ok
    ? projectsQuery.data.projects.find((p) => p.id === task.projectId)
    : undefined;
  // Cards inside Inbox never show a project chip (SPECIFICATION.md "Карточка задачи").
  const showProject = !hideProject && project && !project.isInboxProject;

  return (
    <Transition
      mounted={!completing}
      transition="fade"
      duration={200}
      onExited={() => onComplete?.(task.id)}
    >
      {(transitionStyles) => (
        <Card
          withBorder
          radius="md"
          p="sm"
          style={{
            ...transitionStyles,
            cursor: onClick ? "pointer" : undefined,
          }}
          onClick={onClick}
        >
          <Stack gap={6}>
            <Group gap={6} wrap="nowrap" align="flex-start">
              {onComplete && (
                <Checkbox
                  size="sm"
                  checked={completing || task.checked}
                  disabled={completing}
                  aria-label={`Complete "${task.title}"`}
                  // Stops dnd-kit's drag sensor (attached via `listeners` on the
                  // card's outer element, see DraggableTaskCard.tsx) from picking
                  // up the click and starting a drag instead of toggling, and
                  // stops the card's own `onClick` (opening the detail modal)
                  // from firing on top of completing the task.
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => setCompleting(true)}
                />
              )}
              {priorityColor && (
                <Tooltip label={task.priority.toUpperCase()}>
                  <Paper radius="xl" w={8} h={8} mt={6} bg={priorityColor} />
                </Tooltip>
              )}
              <Text size="sm" fw={500} style={{ flex: 1 }}>
                {task.title}
              </Text>
            </Group>

            {(due ||
              showKanbanStatus ||
              showProject ||
              task.labels.length > 0) && (
              <Group gap={6}>
                {due && (
                  <Badge
                    size="sm"
                    variant="light"
                    // Red wins when a task is both overdue and due today (e.g.
                    // today at a past time) — see getDueDisplay's doc comment.
                    color={
                      due.isOverdue ? "red" : due.isDueToday ? "blue" : "gray"
                    }
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
                    color={KANBAN_STATUS_COLORS[kanbanStatusLevel]}
                    rightSection={
                      task.kanbanStatus.hasConflict && (
                        <Tooltip label="Multiple kanban labels on this task — showing the rightmost column">
                          <BadgeAlertIcon size={12} animateOnHover={false} />
                        </Tooltip>
                      )
                    }
                  >
                    {KANBAN_COLUMN_LABELS[kanbanStatusLevel]}
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
      )}
    </Transition>
  );
};
