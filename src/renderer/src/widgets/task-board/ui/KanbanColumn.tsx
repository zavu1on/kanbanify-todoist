import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { PlusIcon } from "lucide-animated";
import type { FC } from "react";
import { KANBAN_COLUMN_LABELS } from "@/entities/task";
import type { KanbanStatusLevel, Task } from "@/main/tasks";
import { DraggableTaskCard } from "./DraggableTaskCard";

type KanbanColumnProps = {
  status: KanbanStatusLevel;
  tasks: Task[];
  isDropTarget: boolean;
  hideProject?: boolean;
};

export const KanbanColumn: FC<KanbanColumnProps> = ({
  status,
  tasks,
  isDropTarget,
  hideProject,
}) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <Paper
      withBorder
      radius="md"
      p="xs"
      bg={isDropTarget ? "var(--mantine-color-blue-light)" : undefined}
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

        {/* Creates a task pre-filled with this column's status — rendering only,
         * per this feature's scope (task creation ships separately). */}
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={`Add task to ${KANBAN_COLUMN_LABELS[status]}`}
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
              />
            ))}
          </SortableContext>
        </Stack>
      </ScrollArea.Autosize>
    </Paper>
  );
};
