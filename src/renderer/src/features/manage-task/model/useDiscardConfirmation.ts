import type { UseFormReturnType } from "@mantine/form";
import { type KeyboardEvent, useState } from "react";
import type { TaskFormValues } from "./taskFormSchema";

type UseDiscardConfirmationParams = {
  form: UseFormReturnType<TaskFormValues>;
  rawTitle: string;
  initialRawTitle: string;
  onClose: () => void;
};

/**
 * Confirms before closing a dirty form (Cancel button or Escape), so an
 * unsaved edit isn't lost silently.
 */
export const useDiscardConfirmation = ({
  form,
  rawTitle,
  initialRawTitle,
  onClose,
}: UseDiscardConfirmationParams) => {
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const requestClose = () => {
    if (form.isDirty() || rawTitle !== initialRawTitle) {
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
