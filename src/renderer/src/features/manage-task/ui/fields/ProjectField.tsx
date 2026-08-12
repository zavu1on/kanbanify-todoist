import { Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { TaskFormValues } from "../../model/taskFormSchema";

type ProjectFieldProps = {
  form: UseFormReturnType<TaskFormValues>;
  projectOptions: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string | null) => void;
};

/** Its own component so picking a project only re-renders this field, not
 * its siblings (see `TaskFormFields`). */
export const ProjectField = ({
  form,
  projectOptions,
  disabled,
  onChange,
}: ProjectFieldProps) => (
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
);
