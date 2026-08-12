import { Group } from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import type { TaskFormValues } from "../../model/taskFormSchema";

type DueDateTimeFieldProps = {
  form: UseFormReturnType<TaskFormValues>;
  onDueDateChange: (value: string | null) => void;
  onDueTimeChange: (value: string) => void;
};

/** Date and time stay one component (not two) — they're tightly coupled
 * (Time is disabled without a Date, and the due-token text combines both),
 * so splitting them wouldn't buy extra isolation, just extra ref plumbing.
 * Kept out of its siblings so picking a due date/time only re-renders this
 * field (see `TaskFormFields`). */
export const DueDateTimeField = ({
  form,
  onDueDateChange,
  onDueTimeChange,
}: DueDateTimeFieldProps) => (
  <Group grow align="flex-start">
    <DatePickerInput
      label="Date"
      placeholder="No date"
      clearable
      key={form.key("dueDate")}
      {...form.getInputProps("dueDate")}
      onChange={(value) =>
        onDueDateChange(typeof value === "string" ? value : null)
      }
    />
    <TimeInput
      label="Time"
      disabled={!form.values.dueDate}
      key={form.key("dueTime")}
      {...form.getInputProps("dueTime")}
      value={form.values.dueTime ?? ""}
      onChange={(event) => onDueTimeChange(event.currentTarget.value)}
    />
  </Group>
);
