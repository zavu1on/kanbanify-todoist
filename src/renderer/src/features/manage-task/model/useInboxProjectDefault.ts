import type { UseFormReturnType } from "@mantine/form";
import { useEffect } from "react";
import type { TaskFormValues } from "./taskFormSchema";

type UseInboxProjectDefaultParams = {
  form: UseFormReturnType<TaskFormValues>;
  isEditMode: boolean;
  defaultProjectId: string | undefined;
  inboxProject: { id: string } | undefined;
};

/**
 * Projects usually resolve before this modal ever opens (the calling page
 * already subscribes to `useProjectsQuery`), but when they don't, the Inbox
 * fallback isn't known yet at `useForm`'s initial-values snapshot — this
 * backfills it once it is, and immediately resets the dirty snapshot so
 * this default doesn't itself count as an unsaved edit (see
 * `useDiscardConfirmation`).
 */
export const useInboxProjectDefault = ({
  form,
  isEditMode,
  defaultProjectId,
  inboxProject,
}: UseInboxProjectDefaultParams) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-runs when the Inbox project itself resolves — form/isEditMode/defaultProjectId are stable for the modal's lifetime
  useEffect(() => {
    if (isEditMode || defaultProjectId || form.values.projectId) return;
    if (!inboxProject) return;

    form.setFieldValue("projectId", inboxProject.id);
    form.resetDirty();
  }, [inboxProject]);
};
