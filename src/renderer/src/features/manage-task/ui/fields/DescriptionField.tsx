import { Textarea } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { TaskFormValues } from "../../model/taskFormSchema";

type DescriptionFieldProps = {
  form: UseFormReturnType<TaskFormValues>;
};

/** Its own component so editing the description only re-renders this field,
 * not its siblings (see `TaskFormFields`). */
export const DescriptionField = ({ form }: DescriptionFieldProps) => (
  <Textarea
    aria-label="Description"
    placeholder="Add a description"
    variant="unstyled"
    minRows={3}
    styles={{ input: { background: "#fafbfd", borderRadius: 9, padding: 10 } }}
    key={form.key("description")}
    {...form.getInputProps("description")}
  />
);
