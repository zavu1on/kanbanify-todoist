import { Box, Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useState } from "react";
import { PRIORITY_MARKER_COLORS } from "@/entities/task";
import { PRIORITY_LEVELS } from "@/main/tasks";
import type { TaskFormValues } from "../../model/taskFormSchema";
import { FieldChip } from "../FieldChip";

type PriorityFieldProps = {
  form: UseFormReturnType<TaskFormValues>;
  onChange: (value: string | null) => void;
};

/** Its own component so picking a priority only re-renders this field, not
 * its siblings (see `TaskFormFields`). Reuses `PRIORITY_MARKER_COLORS` — the
 * same colors `TaskCard`'s priority rail uses — for the chip's marker dot,
 * so p4 (the default, no marker on the card either) reads as the empty
 * state. */
export const PriorityField = ({ form, onChange }: PriorityFieldProps) => {
  const [priority, setPriority] = useState(form.getValues().priority);
  form.watch("priority", ({ value }) => setPriority(value));

  const markerColor = PRIORITY_MARKER_COLORS[priority];

  return (
    <FieldChip
      icon={
        <Box
          w={8}
          h={8}
          bdrs={999}
          bg={markerColor ?? "#b6bcc7"}
          style={{ flexShrink: 0 }}
        />
      }
      label={markerColor ? priority.toUpperCase() : "Priority"}
      isEmpty={!markerColor}
    >
      <Select
        label="Priority"
        data={[...PRIORITY_LEVELS].map((level) => ({
          value: level,
          label: level.toUpperCase(),
        }))}
        allowDeselect={false}
        key={form.key("priority")}
        {...form.getInputProps("priority")}
        onChange={onChange}
      />
    </FieldChip>
  );
};
