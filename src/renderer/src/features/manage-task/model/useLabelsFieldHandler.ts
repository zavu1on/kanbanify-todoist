import type { UseFormReturnType } from "@mantine/form";
import { useState } from "react";
import type { LabelDTO } from "@/main/labels";
import type { KanbanStatusLevel as KanbanStatusLevelType } from "@/main/tasks";
import {
  buildKanbanStatusToken,
  type QuickAddContext,
} from "../lib/parseQuickAdd";
import { syncLabelTokens } from "./syncLabelTokens";
import type { TaskFormValues } from "./taskFormSchema";

type UseLabelsFieldHandlerParams = {
  form: UseFormReturnType<TaskFormValues>;
  // A getter, not the value itself — `rawTitle` lives in `QuickAddTitleField`
  // (kept out of this hook's own caller so a label pick doesn't re-render the
  // title field or vice versa), so this reads it imperatively instead of
  // subscribing to every change.
  getRawTitle: () => string;
  quickAddContext: QuickAddContext;
  reservedLabels: readonly string[];
  knownLabels: LabelDTO[];
  onUnknownLabel: (name: string) => void;
  applyRawTitle: (text: string) => void;
  resyncTitleToken: (
    type: "priority" | "due" | "project" | "kanbanStatus",
    tokenText: string | null,
  ) => void;
};

/**
 * The Labels field is more than a plain multi-select: adding one of the
 * reserved kanban labels (`todo`/`in-progress`/`completed`) must set the
 * Kanban status instead of becoming a regular label (SPECIFICATION.md
 * "Детальное отображение задачи") — so a pick is held in
 * `pendingReservedLabel` and routed to the status field only after the user
 * confirms, rather than silently reinterpreting their input.
 */
export const useLabelsFieldHandler = ({
  form,
  getRawTitle,
  quickAddContext,
  reservedLabels,
  knownLabels,
  onUnknownLabel,
  applyRawTitle,
  resyncTitleToken,
}: UseLabelsFieldHandlerParams) => {
  const [pendingReservedLabel, setPendingReservedLabel] = useState<
    string | null
  >(null);

  const applyLabelsChange = (newLabels: string[]) => {
    form.setFieldValue("labels", newLabels);
    applyRawTitle(syncLabelTokens(getRawTitle(), newLabels, quickAddContext));
  };

  const handleLabelsChange = (newLabels: string[]) => {
    const added = newLabels.filter((l) => !form.values.labels.includes(l));
    const reserved = added.find((l) =>
      reservedLabels.includes(l.toLowerCase()),
    );

    if (reserved) {
      setPendingReservedLabel(reserved);
      return;
    }

    for (const name of added) {
      const exists = knownLabels.some(
        (l) => l.name.toLowerCase() === name.toLowerCase(),
      );
      if (!exists) onUnknownLabel(name);
    }

    applyLabelsChange(newLabels);
  };

  const confirmReservedLabel = () => {
    if (!pendingReservedLabel) return;
    const status = pendingReservedLabel.toLowerCase() as Exclude<
      KanbanStatusLevelType,
      "none"
    >;

    form.setFieldValue("kanbanStatus", status);

    resyncTitleToken("kanbanStatus", buildKanbanStatusToken(status));
    setPendingReservedLabel(null);
  };

  const cancelReservedLabel = () => setPendingReservedLabel(null);

  return {
    handleLabelsChange,
    pendingReservedLabel,
    confirmReservedLabel,
    cancelReservedLabel,
  };
};
