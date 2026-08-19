import { Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { FolderKanbanIcon } from "lucide-animated";
import { useState } from "react";
import type { TaskFormValues } from "../../model/taskFormSchema";
import { FieldChip } from "../FieldChip";

type ProjectFieldProps = {
  form: UseFormReturnType<TaskFormValues>;
  projectOptions: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string | null) => void;
};

/** Its own component so picking a project only re-renders this field, not
 * its siblings (see `TaskFormFields`). Tracks the field's own value via
 * `form.watch` (the form runs in "uncontrolled" mode, so `form.values` isn't
 * reactive on its own) purely to render the chip trigger's label. */
export const ProjectField = ({
  form,
  projectOptions,
  disabled,
  onChange,
}: ProjectFieldProps) => {
  const [projectId, setProjectId] = useState(form.getValues().projectId);
  form.watch("projectId", ({ value }) => setProjectId(value));

  const label =
    projectOptions.find((p) => p.value === projectId)?.label ?? "Project";

  return (
    <FieldChip
      icon={<FolderKanbanIcon size={14} animateOnHover={false} />}
      label={label}
      disabled={disabled}
    >
      <Select
        label="Project"
        data={projectOptions}
        searchable
        allowDeselect={false}
        disabled={disabled}
        key={form.key("projectId")}
        {...form.getInputProps("projectId")}
        onChange={onChange}
      />
    </FieldChip>
  );
};
