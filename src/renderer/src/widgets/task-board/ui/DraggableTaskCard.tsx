import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FC } from "react";
import { TaskCard } from "@/entities/task";
import type { Task } from "@/main/tasks";

type DraggableTaskCardProps = {
  task: Task;
};

export const DraggableTaskCard: FC<DraggableTaskCardProps> = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      // dnd-kit drives the drag offset via `transform`/`transition`, which have
      // no Mantine style-prop equivalent — this is the one case inline style
      // is warranted. The dragged card itself renders through `DragOverlay`
      // (see TaskBoard.tsx), so this copy is hidden rather than faded.
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        cursor: "grab",
      }}
    >
      <TaskCard task={task} hideKanbanStatus />
    </div>
  );
};
