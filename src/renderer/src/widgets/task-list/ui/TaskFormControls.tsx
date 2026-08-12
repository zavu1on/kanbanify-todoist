import { Button } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { PlusIcon } from "lucide-animated";
import { type Ref, useImperativeHandle, useState } from "react";
import { TaskFormModal } from "@/features/manage-task";
import type { TaskDTO } from "@/main/tasks";

export type TaskFormControlsHandle = {
  openEdit: (task: TaskDTO) => void;
};

type TaskFormControlsProps = {
  ref: Ref<TaskFormControlsHandle>;
  queryKey: QueryKey;
  // Pre-fills the "Add task" modal's project (see SPECIFICATION.md "Добавление
  // задачи") — absent on the global "Tasks" page, set on a project's page.
  projectId?: string;
};

/** Owns the "Add task" button, `TaskFormModal` and the add/edit state behind
 * both — kept out of `TaskListView` so opening/editing a task doesn't
 * re-render the whole task list, only this component. `openEdit` is exposed
 * imperatively so a `TaskCard`'s click can trigger it without lifting the
 * state back up into `TaskListView`. */
export const TaskFormControls = ({
  ref,
  queryKey,
  projectId,
}: TaskFormControlsProps) => {
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openEdit: (task) => setEditingTask(task),
  }));

  return (
    <>
      <Button
        variant="subtle"
        color="gray"
        justify="flex-start"
        leftSection={<PlusIcon size={16} animateOnHover={false} />}
        onClick={() => setIsCreateOpen(true)}
      >
        Add task
      </Button>

      {/* Mounted only while open — a fresh instance each time means the
          form always starts blank and `useForm`'s initialValues pick up
          the current `defaults` instead of whatever they were on first
          mount (see `Sidebar`'s "New task" modal). */}
      {(editingTask || isCreateOpen) && (
        <TaskFormModal
          opened
          onClose={() => {
            setEditingTask(null);
            setIsCreateOpen(false);
          }}
          queryKey={queryKey}
          task={editingTask ?? undefined}
          defaults={{ projectId }}
        />
      )}
    </>
  );
};
