import type { UseFormReturnType } from "@mantine/form";
import { type KeyboardEvent, useState } from "react";
import type { TaskFormValues } from "./taskFormSchema";

type UseDiscardConfirmationParams = {
  form: UseFormReturnType<TaskFormValues>;
  // A getter, not the value itself — `rawTitle` lives in `TaskFormFields`
  // (kept out of `TaskFormFrame`'s state so typing doesn't re-render the
  // frame), so this reads it imperatively at close-time instead of
  // subscribing to every change.
  getRawTitle: () => string;
  initialRawTitle: string;
  onClose: () => void;
};

/**
 * Confirms before closing a dirty form (Cancel button or Escape), so an
 * unsaved edit isn't lost silently.
 */
export const useDiscardConfirmation = ({
  form,
  getRawTitle,
  initialRawTitle,
  onClose,
}: UseDiscardConfirmationParams) => {
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const requestClose = () => {
    if (form.isDirty() || getRawTitle() !== initialRawTitle) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    onClose();
  };

  // Own Escape ourselves instead of Mantine's built-in `closeOnEscape`
  // (`Modal`'s window-level listener) — same target check Mantine's own
  // handler uses, so a Select/DatePicker/TagsInput dropdown still just
  // closes itself on the first Escape rather than the whole modal.
  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    const target = event.target as HTMLElement | null;
    if (
      event.key === "Escape" &&
      target?.getAttribute("data-mantine-stop-propagation") !== "true"
    ) {
      requestClose();
    }
  };

  return {
    isDiscardConfirmOpen,
    cancelDiscard: () => setIsDiscardConfirmOpen(false),
    requestClose,
    handleFormKeyDown,
  };
};
