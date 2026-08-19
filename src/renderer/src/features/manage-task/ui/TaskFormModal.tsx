import { Modal, Text, UnstyledButton } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { type FC, useRef, useState } from "react";
import { subtasksListQueryKey } from "@/entities/task";
import type { TaskDTO } from "@/main/tasks";
import { type TaskFormDefaults, TaskFormFrame } from "./TaskFormFrame";

export type { TaskFormDefaults };

/** A pushed frame is always a subtask context — `task` present means editing
 * an existing subtask, absent means creating a new one under `parentTask`
 * (SPECIFICATION.md: "Подзадачи в режиме создания добавить нельзя", so a
 * freshly created subtask can't itself be the parent of a pushed frame). */
type StackFrame = { task?: TaskDTO; parentTask: TaskDTO };

const frameKey = (frame: StackFrame): string =>
  frame.task ? frame.task.id : `new-under-${frame.parentTask.id}`;

type TaskFormModalProps = {
  opened: boolean;
  onClose: () => void;
  /** The list cache this modal was opened from — optimistic writes land here,
   * see `useCreateTaskMutation`/`useUpdateTaskMutation`. */
  queryKey: QueryKey;
  /** Absent in create mode. */
  task?: TaskDTO;
  /** Only used in create mode — pre-fills the form from the calling context
   * (kanban column, project page, ...), see SPECIFICATION.md "Добавление задачи". */
  defaults?: TaskFormDefaults;
};

/**
 * Re-renders in place instead of opening a new modal when navigating into a
 * subtask (SPECIFICATION.md "Детальное отображение задачи") — every frame
 * (the root task and each subtask pushed on top) stays mounted for the
 * modal's lifetime, only the top one visible, so a form's in-progress edits
 * survive the round trip to a subtask and back (see `TaskFormFrame`).
 */
export const TaskFormModal: FC<TaskFormModalProps> = ({
  opened,
  onClose,
  queryKey,
  task,
  defaults,
}) => {
  const [stack, setStack] = useState<StackFrame[]>([]);
  // The currently visible frame's own dirty-check "leave" function — the
  // modal's backdrop/✕ click and the breadcrumb link both go through
  // whichever frame is on top, without the shell reaching into
  // `useDiscardConfirmation` itself (see `TaskFormFrame`'s `registerLeave`).
  const activeLeaveRef = useRef<() => void>(() => {});

  const topFrame = stack.at(-1);

  const pushSubtask = (subtask: TaskDTO, parentTask: TaskDTO) =>
    setStack((s) => [...s, { task: subtask, parentTask }]);
  const pushNewSubtask = (parentTask: TaskDTO) =>
    setStack((s) => [...s, { parentTask }]);
  const popFrame = () => setStack((s) => s.slice(0, -1));

  return (
    <Modal
      opened={opened}
      onClose={() => activeLeaveRef.current()}
      closeOnEscape={false}
      title={
        topFrame ? (
          <UnstyledButton onClick={() => activeLeaveRef.current()}>
            <Text fw={650} size="lg">
              ← {topFrame.parentTask.title}
            </Text>
          </UnstyledButton>
        ) : (
          <Text fw={650} size="lg">
            {task ? "Edit task" : "New task"}
          </Text>
        )
      }
      size="xl"
    >
      <div style={{ display: topFrame ? "none" : undefined }}>
        <TaskFormFrame
          queryKey={queryKey}
          task={task}
          defaults={defaults}
          onOpenSubtask={(subtask) => task && pushSubtask(subtask, task)}
          onAddSubtask={() => task && pushNewSubtask(task)}
          onCloseModal={onClose}
          registerLeave={(fn) => {
            if (!topFrame) activeLeaveRef.current = fn;
          }}
        />
      </div>

      {stack.map((frame, index) => {
        const isTop = index === stack.length - 1;
        return (
          <div
            key={frameKey(frame)}
            style={{ display: isTop ? undefined : "none" }}
          >
            <TaskFormFrame
              queryKey={subtasksListQueryKey(frame.parentTask.id)}
              task={frame.task}
              parentTask={frame.parentTask}
              defaults={{ projectId: frame.parentTask.projectId }}
              onOpenSubtask={(subtask) =>
                frame.task && pushSubtask(subtask, frame.task)
              }
              onAddSubtask={() => frame.task && pushNewSubtask(frame.task)}
              onBack={popFrame}
              onCloseModal={onClose}
              registerLeave={(fn) => {
                if (isTop) activeLeaveRef.current = fn;
              }}
            />
          </div>
        );
      })}
    </Modal>
  );
};
