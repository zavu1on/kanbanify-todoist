import { Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { LayoutPanelTopIcon } from "lucide-animated";
import { useState } from "react";
import { KANBAN_COLUMN_LABELS } from "@/entities/task";
import { KANBAN_STATUS_LEVELS } from "@/main/tasks";
import type { TaskFormValues } from "../../model/taskFormSchema";
import { FieldChip } from "../FieldChip";

type KanbanStatusFieldProps = {
  form: UseFormReturnType<TaskFormValues>;
  onChange: (value: string | null) => void;
};

/** Its own component so picking a kanban status only re-renders this field,
 * not its siblings (see `TaskFormFields`). */
export const KanbanStatusField = ({
  form,
  onChange,
}: KanbanStatusFieldProps) => {
  const [kanbanStatus, setKanbanStatus] = useState(
    form.getValues().kanbanStatus,
  );
  form.watch("kanbanStatus", ({ value }) => setKanbanStatus(value));

  return (
    <FieldChip
      icon={<LayoutPanelTopIcon size={14} animateOnHover={false} />}
      label={KANBAN_COLUMN_LABELS[kanbanStatus]}
      isEmpty={kanbanStatus === "none"}
    >
      <Select
        label="Kanban status"
        data={KANBAN_STATUS_LEVELS.map((level) => ({
          value: level,
          label: KANBAN_COLUMN_LABELS[level],
        }))}
        allowDeselect={false}
        key={form.key("kanbanStatus")}
        {...form.getInputProps("kanbanStatus")}
        onChange={onChange}
      />
    </FieldChip>
  );
};
