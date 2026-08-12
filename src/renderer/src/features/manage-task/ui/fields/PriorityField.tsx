import { Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { PRIORITY_LEVELS } from "@/main/tasks";
import type { TaskFormValues } from "../../model/taskFormSchema";

type PriorityFieldProps = {
  form: UseFormReturnType<TaskFormValues>;
  onChange: (value: string | null) => void;
};

/** Its own component so picking a priority only re-renders this field, not
 * its siblings (see `TaskFormFields`). */
export const PriorityField = ({ form, onChange }: PriorityFieldProps) => (
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
);
