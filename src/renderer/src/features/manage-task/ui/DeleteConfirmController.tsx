import type { QueryKey } from "@tanstack/react-query";
import { type Ref, useImperativeHandle, useState } from "react";
import {
  DeleteTaskConfirmModal,
  useDeleteTaskMutation,
} from "@/features/delete-task";

export type DeleteConfirmControllerHandle = {
  open: () => void;
};

type DeleteConfirmControllerProps = {
  ref: Ref<DeleteConfirmControllerHandle>;
  queryKey: QueryKey;
  taskId: string;
  /** Closes this frame first (pop or close the modal) — the mutation's cache
   * write no longer needs to be reconciled with this frame being on screen
   * for the task it just removed. */
  onDeleted: () => void;
};

/**
 * Owns `isDeleteConfirmOpen`, the delete mutation and `DeleteTaskConfirmModal`
 * — its own component so opening/closing this confirmation doesn't re-render
 * `TaskFormFrame` and, with it, the still-mounted `TaskFormFields` and every
 * field under it. `open` is exposed imperatively for the Delete button,
 * which lives in `TaskFormFrame` and doesn't need to re-render on this
 * state either.
 */
export const DeleteConfirmController = ({
  ref,
  queryKey,
  taskId,
  onDeleted,
}: DeleteConfirmControllerProps) => {
  const deleteTaskMutation = useDeleteTaskMutation(queryKey);
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({ open: () => setIsOpen(true) }));

  const handleConfirm = () => {
    setIsOpen(false);
    onDeleted();
    deleteTaskMutation.mutate({ taskId });
  };

  return (
    <DeleteTaskConfirmModal
      opened={isOpen}
      onCancel={() => setIsOpen(false)}
      onConfirm={handleConfirm}
    />
  );
};
