import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { useChangeTaskStatusMutation } from "@/features/change-task-status";
import type { KanbanStatusLevel, Task } from "@/main/tasks";
import { buildColumns } from "./buildColumns";
import { findContainer } from "./findContainer";

export const useDragOnDropHandlers = (tasks: Task[]) => {
  const changeStatusMutation = useChangeTaskStatusMutation();

  const [columns, setColumns] = useState(() => buildColumns(tasks));
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Tracks the column currently under the pointer so `KanbanColumn` can
  // highlight it — kept separate from `isOver` on each column's own
  // droppable, which would also fire while a card hovers back over the
  // column it started in (see handleDragOver).
  const [hoveredStatus, setHoveredStatus] = useState<KanbanStatusLevel | null>(
    null,
  );

  // Drops the live drag preview once the server-backed `tasks` prop catches
  // up with the move (optimistic update or rollback) — see handleDragEnd.
  useEffect(() => {
    setColumns((current) => buildColumns(tasks, current));
  }, [tasks]);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasks.find((task) => task.id === active.id) ?? null);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) {
      setHoveredStatus(null);
      return;
    }

    const activeContainer = findContainer(active.id, columns);
    const overContainer = findContainer(over.id, columns);
    setHoveredStatus(overContainer ?? null);
    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setColumns((current) => {
      const activeItems = current.get(activeContainer) ?? [];
      const overItems = current.get(overContainer) ?? [];
      const activeTask = activeItems.find((task) => task.id === active.id);
      if (!activeTask) return current;

      const overIndex = overItems.findIndex((task) => task.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;

      const next = new Map(current);
      next.set(
        activeContainer,
        activeItems.filter((task) => task.id !== active.id),
      );
      next.set(overContainer, [
        ...overItems.slice(0, insertAt),
        activeTask,
        ...overItems.slice(insertAt),
      ]);
      return next;
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    setHoveredStatus(null);
    if (!over) {
      setColumns(buildColumns(tasks));
      return;
    }

    const task = tasks.find((candidate) => candidate.id === active.id);
    const targetStatus = findContainer(over.id, columns);
    if (!task || !targetStatus || task.kanbanStatus.level === targetStatus) {
      setColumns(buildColumns(tasks));
      return;
    }

    changeStatusMutation.mutate({ taskId: task.id, status: targetStatus });
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setHoveredStatus(null);
    setColumns(buildColumns(tasks));
  };

  return {
    columns,
    activeTask,
    // A column is a genuine drop target only when hovered by a card that
    // didn't start there — dragging back over the origin column doesn't count.
    dropTargetStatus:
      hoveredStatus && hoveredStatus !== activeTask?.kanbanStatus.level
        ? hoveredStatus
        : null,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
};
