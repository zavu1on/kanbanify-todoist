import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { PlusIcon } from "lucide-animated";
import type { FC } from "react";
import { useCallback, useRef } from "react";
import { KANBAN_COLUMN_LABELS } from "@/entities/task";
import type { KanbanStatusLevel, TaskDTO } from "@/main/tasks";
import { DraggableTaskCard } from "./DraggableTaskCard";

type KanbanColumnProps = {
  status: KanbanStatusLevel;
  tasks: TaskDTO[];
  isDropTarget: boolean;
  hideProject?: boolean;
  onComplete: (taskId: string) => void;
  onTaskClick: (task: TaskDTO) => void;
  onAddTask: () => void;
};

export const KanbanColumn: FC<KanbanColumnProps> = ({
  status,
  tasks,
  isDropTarget,
  hideProject,
  onComplete,
  onTaskClick,
  onAddTask,
}) => {
  const { setNodeRef } = useDroppable({ id: status });

  // Read through a ref instead of closing over `tasks` directly — `tasks`
  // (this column's slice of `buildColumns`) is a fresh array on nearly every
  // render, so a `useCallback` depending on it would defeat the point: every
  // `DraggableTaskCard` needs the *same* `onClick` reference across renders
  // for its `memo` to skip cards whose own task didn't change.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const handleCardClick = useCallback(
    (taskId: string) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (task) onTaskClick(task);
    },
    [onTaskClick],
  );

  return (
    <Paper
      radius={14}
      p="xs"
      bg={isDropTarget ? "rgba(47,111,179,0.06)" : undefined}
      bd={
        isDropTarget
          ? "1px dashed rgba(47,111,179,0.35)"
          : "1px solid var(--mantine-color-default-border)"
      }
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 260,
        flex: 1,
      }}
    >
      <Group justify="space-between" px="xs" py={4}>
        <Group gap={6}>
          <Text size="sm" fw={600}>
            {KANBAN_COLUMN_LABELS[status]}
          </Text>
          <Badge size="sm" variant="light" color="gray" circle>
            {tasks.length}
          </Badge>
        </Group>

        {/* Creates a task pre-filled with this column's status (SPECIFICATION.md
         * "Kanban-режим"). */}
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={`Add task to ${KANBAN_COLUMN_LABELS[status]}`}
          onClick={onAddTask}
        >
          <PlusIcon size={16} animateOnHover={false} />
        </ActionIcon>
      </Group>

      <ScrollArea.Autosize mah="calc(100vh - 260px)">
        <Stack ref={setNodeRef} gap="xs" p="xs" mih={40}>
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                hideProject={hideProject}
                onComplete={onComplete}
                onClick={handleCardClick}
              />
            ))}
          </SortableContext>

          {isDropTarget && (
            <Box
              h={56}
              bd="1px dashed rgba(47,111,179,0.35)"
              bdrs={11}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text size="xs" fw={600} c="#2f6fb3">
                Drop here
              </Text>
            </Box>
          )}
        </Stack>
      </ScrollArea.Autosize>
    </Paper>
  );
};
