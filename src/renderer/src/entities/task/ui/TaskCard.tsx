import {
  Badge,
  Box,
  Card,
  Checkbox,
  Group,
  Text,
  Tooltip,
  Transition,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { BadgeAlertIcon, ClockIcon } from "lucide-animated";
import type { FC } from "react";
import { memo, useState } from "react";
import { getProjectColorHex, useProjectsQuery } from "@/entities/project";
import type { TaskDTO } from "@/main/tasks";
import { DUE_STATE_COLORS, getDueDisplay } from "../lib/dueDate";
import {
  KANBAN_COLUMN_LABELS,
  KANBAN_STATUS_COLORS,
} from "../lib/kanbanColumns";
import { PRIORITY_MARKER_COLORS } from "../lib/priority";
import { TaskCardCompactRow } from "./TaskCardCompactRow";
import { TaskCardExpandedStack } from "./TaskCardExpandedStack";
import { TaskCardSingleRow } from "./TaskCardSingleRow";
import type { TaskCardVariant } from "./TaskCardBodyProps";

// Cards never show more than this many labels before collapsing the rest
// into a "+N" pill — purely a display choice, `task.labels` itself is
// unaffected.
const MAX_VISIBLE_LABELS = 2;

type TaskCardProps = {
  task: TaskDTO;
  // The kanban board already conveys status via the column — pass this to
  // drop the redundant status pill there.
  hideKanbanStatus?: boolean;
  // Every card on a project's page belongs to that same project — pass this
  // there to drop the redundant project chip.
  hideProject?: boolean;
  // Omitted where completing doesn't make sense (e.g. the kanban drag preview
  // in `DragOverlay`, see TaskBoardView.tsx) — the checkbox itself only renders
  // when this is passed.
  onComplete?: (taskId: string) => void;
  // Opens the task detail modal (SPECIFICATION.md "Карточка задачи": "Клик по
  // карточке открывает Детальное отображение задачи"). Omitted for the kanban
  // drag preview, same reasoning as `onComplete`. Takes the task id (not the
  // task itself) so callers can pass a referentially stable handler shared
  // across every card instead of a fresh closure per task — see
  // TaskListView.tsx.
  onClick?: (taskId: string) => void;
  // "list" (default): single-row layout for flat lists (Tasks, Today,
  // Agenda). "board": two-row layout for the kanban board's narrow columns.
  // "compact": plain list-row used for subtask rows inside the detail modal.
  variant?: TaskCardVariant;
};

export const TaskCard: FC<TaskCardProps> = memo(function TaskCard({
  task,
  hideKanbanStatus,
  hideProject,
  onComplete,
  onClick,
  variant = "list",
}) {
  // Lets the exit animation play before the task actually leaves the list —
  // `onComplete` (the optimistic-removal mutation) fires from `onExited`,
  // once the card has visually finished disappearing.
  const [completing, setCompleting] = useState(false);
  const { hovered, ref: hoverRef } = useHover<HTMLDivElement>();

  const due = task.due ? getDueDisplay(task.due) : null;
  const priorityRailColor = PRIORITY_MARKER_COLORS[task.priority];
  const kanbanStatusLevel = task.kanbanStatus.level;
  const showKanbanStatus = !hideKanbanStatus && kanbanStatusLevel !== "none";
  const hasConflict = task.kanbanStatus.hasConflict;

  const projectsQuery = useProjectsQuery();
  const project = projectsQuery.data?.ok
    ? projectsQuery.data.projects.find((p) => p.id === task.projectId)
    : undefined;
  // Cards inside Inbox never show a project chip (SPECIFICATION.md "Карточка задачи").
  const showProject = !hideProject && project && !project.isInboxProject;

  const checkbox = onComplete && (
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
  );

  // Red wins when a task is both overdue and due today (e.g. today at a
  // past time) — see getDueDisplay's doc comment.
  const dueColor = due
    ? due.isOverdue
      ? DUE_STATE_COLORS.overdue
      : due.isDueToday
        ? DUE_STATE_COLORS.today
        : undefined
    : undefined;
  const dueHighlighted = Boolean(due && (due.isOverdue || due.isDueToday));
  const dueLabel =
    due?.isOverdue && due.daysOverdue > 0
      ? `${due.daysOverdue} day${due.daysOverdue === 1 ? "" : "s"} overdue · ${due.label}`
      : due?.label;

  const dueMeta = due && (
    <Group
      gap={5}
      wrap="nowrap"
      c={dueColor ?? "dimmed"}
      fw={dueHighlighted ? 600 : 400}
    >
      <ClockIcon size={13} animateOnHover={false} style={{ display: "flex" }} />
      <Text size="xs" c="inherit" fw="inherit">
        {dueLabel}
      </Text>
    </Group>
  );

  const projectMeta = showProject && (
    <Group gap={5} wrap="nowrap" c="dimmed">
      <Box w={7} h={7} bdrs={999} bg={getProjectColorHex(project.color)} />
      <Text size="xs" c="inherit">
        {project.name}
      </Text>
    </Group>
  );

  const kanbanColor = KANBAN_STATUS_COLORS[kanbanStatusLevel];
  const kanbanBg = hasConflict
    ? "rgba(224,179,65,0.14)"
    : kanbanStatusLevel === "in-progress"
      ? "rgba(47,111,179,0.10)"
      : "#f2f3f7";
  const kanbanTextColor = hasConflict ? "#8a6a13" : kanbanColor;

  const kanbanPill = showKanbanStatus && (
    <Badge
      size="sm"
      variant="light"
      radius={7}
      tt="none"
      fw={650}
      styles={{
        root: {
          backgroundColor: kanbanBg,
          color: kanbanTextColor,
          border: "none",
        },
      }}
      leftSection={
        hasConflict ? (
          <Tooltip label="Multiple kanban labels on this task — showing the rightmost column">
            <BadgeAlertIcon size={12} animateOnHover={false} />
          </Tooltip>
        ) : (
          <Box w={6} h={6} bdrs={999} bg={kanbanColor} />
        )
      }
    >
      {KANBAN_COLUMN_LABELS[kanbanStatusLevel]}
    </Badge>
  );

  const visibleLabels = task.labels.slice(0, MAX_VISIBLE_LABELS);
  const hiddenLabelCount = task.labels.length - visibleLabels.length;
  const labelPills = task.labels.length > 0 && (
    <Group gap={6} wrap="nowrap">
      {visibleLabels.map((label) => (
        <Badge
          key={label}
          size="sm"
          variant="outline"
          color="gray"
          radius={7}
          tt="none"
          fw={500}
        >
          {label}
        </Badge>
      ))}
      {hiddenLabelCount > 0 && (
        <Badge
          size="sm"
          variant="outline"
          color="gray"
          radius={7}
          tt="none"
          fw={600}
        >
          +{hiddenLabelCount}
        </Badge>
      )}
    </Group>
  );

  const hasMeta = Boolean(
    due || showKanbanStatus || showProject || task.labels.length > 0,
  );

  const bodyProps = {
    checkbox,
    title: task.title,
    hasMeta,
    dueMeta,
    projectMeta,
    kanbanPill,
    labelPills,
    hovered,
  };

  return (
    <Transition
      mounted={!completing}
      transition="fade"
      duration={200}
      onExited={() => onComplete?.(task.id)}
    >
      {(transitionStyles) => (
        <Card
          ref={hoverRef}
          withBorder={variant !== "compact"}
          radius={variant === "compact" ? 9 : 11}
          p={variant === "compact" ? 9 : "sm"}
          pos="relative"
          bg={variant === "compact" && hovered ? "#fafbfd" : undefined}
          style={{
            ...transitionStyles,
            cursor: onClick ? "pointer" : undefined,
          }}
          onClick={onClick && (() => onClick(task.id))}
        >
          {/* Rendered here (not inside a body variant) so it always sits at
              the card's true edge, unaffected by the body's own padding. */}
          {priorityRailColor && variant !== "compact" && (
            <Box
              pos="absolute"
              top={9}
              bottom={9}
              left={0}
              w={3}
              bg={priorityRailColor}
              bdrs="0 999px 999px 0"
            />
          )}

          {variant === "board" ? (
            <TaskCardExpandedStack {...bodyProps} />
          ) : variant === "compact" ? (
            <TaskCardCompactRow {...bodyProps} />
          ) : (
            <TaskCardSingleRow {...bodyProps} />
          )}
        </Card>
      )}
    </Transition>
  );
});
