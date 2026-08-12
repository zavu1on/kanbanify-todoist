import type { UseFormReturnType } from "@mantine/form";
import { type KeyboardEvent, type Ref, useImperativeHandle } from "react";
import type { TaskFormValues } from "../model/taskFormSchema";
import { useDiscardConfirmation } from "../model/useDiscardConfirmation";
import { DiscardChangesModal } from "./DiscardChangesModal";

export type DiscardConfirmControllerHandle = {
  requestClose: () => void;
  handleFormKeyDown: (event: KeyboardEvent<HTMLFormElement>) => void;
};

type DiscardConfirmControllerProps = {
  ref: Ref<DiscardConfirmControllerHandle>;
  form: UseFormReturnType<TaskFormValues>;
  getRawTitle: () => string;
  initialRawTitle: string;
  onClose: () => void;
};

/**
 * Owns `isDiscardConfirmOpen` and `DiscardChangesModal` — its own component
 * so a Cancel/Escape press on a clean form (the common case, no confirmation
 * needed) doesn't re-render `TaskFormFrame` and, with it, the still-mounted
 * `TaskFormFields` and every field under it. `requestClose`/
 * `handleFormKeyDown` are exposed imperatively since they're triggered from
 * `TaskFormFrame`'s own Cancel button, `<form onKeyDown>` and
 * `registerLeave`, none of which need to re-render on this state either.
 */
export const DiscardConfirmController = ({
  ref,
  form,
  getRawTitle,
  initialRawTitle,
  onClose,
}: DiscardConfirmControllerProps) => {
  const {
    isDiscardConfirmOpen,
    cancelDiscard,
    requestClose,
    handleFormKeyDown,
  } = useDiscardConfirmation({ form, getRawTitle, initialRawTitle, onClose });

  useImperativeHandle(ref, () => ({ requestClose, handleFormKeyDown }));

  return (
    <DiscardChangesModal
      opened={isDiscardConfirmOpen}
      onCancel={cancelDiscard}
      onDiscard={onClose}
    />
  );
};
