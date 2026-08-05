import { useDraggable } from "@dnd-kit/core";
import type { FC } from "react";
import { TaskCard } from "@/entities/task";
import type { Task } from "@/main/tasks";

type DraggableTaskCardProps = {
  task: Task;
};

export const DraggableTaskCard: FC<DraggableTaskCardProps> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      // dnd-kit drives the drag offset via `transform`, which has no Mantine
      // style-prop equivalent — this is the one case inline style is warranted.
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
    >
      <TaskCard task={task} />
    </div>
  );
};
