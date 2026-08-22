import { TagsInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { BookmarkIcon } from "lucide-animated";
import type { RefObject } from "react";
import { useState } from "react";
import type { QuickAddContext } from "../../lib/parseQuickAdd";
import { RESERVED_LABELS } from "../../model/reservedLabels";
import type { TaskFormValues } from "../../model/taskFormSchema";
import { useLabelsFieldHandler } from "../../model/useLabelsFieldHandler";
import { FieldChip } from "../FieldChip";
import { ReservedLabelModal } from "../ReservedLabelModal";
import type { QuickAddTitleFieldHandle } from "./QuickAddTitleField";

type LabelsFieldProps = {
  form: UseFormReturnType<TaskFormValues>;
  labelOptions: string[];
  quickAddContext: QuickAddContext;
  initialRawTitle: string;
  titleFieldRef: RefObject<QuickAddTitleFieldHandle | null>;
};

/**
 * Its own component (not just its own `TagsInput`) because a reserved-label
 * pick opens `ReservedLabelModal`, whose `pendingReservedLabel` state
 * (`useLabelsFieldHandler`) would otherwise force every other field to
 * re-render too if it lived in the shared `TaskFormFields` orchestrator —
 * see `TaskFormFields`. Reaches the title field through `titleFieldRef`
 * instead of props so it doesn't need to re-render when the title changes.
 */
export const LabelsField = ({
  form,
  labelOptions,
  quickAddContext,
  initialRawTitle,
  titleFieldRef,
}: LabelsFieldProps) => {
  const {
    handleLabelsChange,
    pendingReservedLabel,
    confirmReservedLabel,
    cancelReservedLabel,
  } = useLabelsFieldHandler({
    form,
    getRawTitle: () => titleFieldRef.current?.getRawTitle() ?? initialRawTitle,
    quickAddContext,
    reservedLabels: RESERVED_LABELS,
    applyRawTitle: (text) => titleFieldRef.current?.applyRawTitle(text),
    resyncTitleToken: (type, tokenText) =>
      titleFieldRef.current?.resyncTitleToken(type, tokenText),
  });

  const [labels, setLabels] = useState(form.getValues().labels);
  form.watch("labels", ({ value }) => setLabels(value));

  return (
    <>
      <FieldChip
        icon={<BookmarkIcon size={14} animateOnHover={false} />}
        label={
          labels.length > 0
            ? `${labels.length} label${labels.length > 1 ? "s" : ""}`
            : "Labels"
        }
        isEmpty={labels.length === 0}
        popoverWidth={280}
      >
        <TagsInput
          label="Labels"
          placeholder="Search or create a label"
          data={labelOptions}
          key={form.key("labels")}
          {...form.getInputProps("labels")}
          onChange={handleLabelsChange}
        />
      </FieldChip>

      <ReservedLabelModal
        pendingLabel={pendingReservedLabel}
        onCancel={cancelReservedLabel}
        onConfirm={confirmReservedLabel}
      />
    </>
  );
};
