import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FC } from "react";
import { memo } from "react";
import { TaskCard } from "@/entities/task";
import type { TaskDTO } from "@/main/tasks";

type DraggableTaskCardProps = {
  task: TaskDTO;
  hideProject?: boolean;
  onComplete: (taskId: string) => void;
  // Takes the task id, not the task — lets the caller share one referentially
  // stable handler across every card instead of a fresh closure per task
  // (see KanbanColumn.tsx), so `memo` below can actually skip unaffected cards.
  onClick: (taskId: string) => void;
};

export const DraggableTaskCard: FC<DraggableTaskCardProps> = memo(
  function DraggableTaskCard({ task, hideProject, onComplete, onClick }) {
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
        // (see TaskBoardView.tsx), so this copy is hidden rather than faded.
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0 : 1,
          cursor: "grab",
        }}
      >
        <TaskCard
          task={task}
          variant="board"
          hideKanbanStatus
          hideProject={hideProject}
          onComplete={onComplete}
          onClick={onClick}
        />
      </div>
    );
  },
);
