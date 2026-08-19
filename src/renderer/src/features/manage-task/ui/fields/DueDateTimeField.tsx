import { Group } from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import dayjs from "dayjs";
import { CalendarDaysIcon } from "lucide-animated";
import { useState } from "react";
import type { TaskFormValues } from "../../model/taskFormSchema";
import { FieldChip } from "../FieldChip";

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
}: DueDateTimeFieldProps) => {
  const [dueDate, setDueDate] = useState(form.getValues().dueDate);
  const [dueTime, setDueTime] = useState(form.getValues().dueTime);
  form.watch("dueDate", ({ value }) => setDueDate(value));
  form.watch("dueTime", ({ value }) => setDueTime(value));

  const label = dueDate
    ? `${dayjs(dueDate).format("MMM D")}${dueTime ? `, ${dueTime}` : ""}`
    : "Due date";

  return (
    <FieldChip
      icon={<CalendarDaysIcon size={14} animateOnHover={false} />}
      label={label}
      isEmpty={!dueDate}
      popoverWidth={320}
    >
      <Group grow align="flex-start">
        <DatePickerInput
          label="Date"
          placeholder="No date"
          clearable
          valueFormat="DD-MM-YYYY"
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
    </FieldChip>
  );
};
