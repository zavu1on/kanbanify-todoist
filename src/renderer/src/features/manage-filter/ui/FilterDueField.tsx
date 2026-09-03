import { Chip, Group, Stack, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { memo, type FC, useState } from "react";
import { DUE_VARIANTS, type DueVariant } from "@/entities/filter";
import type { FilterFormValues } from "../model/filterFormSchema";

const DUE_LABELS: Record<DueVariant, string> = {
  today_overdue: "Today + Overdue",
  today: "Today",
  next_7_days: "Next 7 days",
  no_date: "No date",
};

type FilterDueFieldProps = {
  form: UseFormReturnType<FilterFormValues>;
};

const FilterDueFieldComponent: FC<FilterDueFieldProps> = ({ form }) => {
  // Local state (not `FilterForm`'s): clicking a checked chip again must
  // clear it, which means knowing the current value — kept here so only
  // this field re-renders on change, not the whole modal.
  const [due, setDue] = useState(form.getValues().due);
  form.watch("due", ({ value }) => setDue(value));

  const toggle = (variant: DueVariant) => {
    form.setFieldValue("due", due === variant ? null : variant);
  };

  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>
        Due
      </Text>
      <Group gap={6}>
        {DUE_VARIANTS.map((variant) => (
          <Chip
            key={variant}
            checked={due === variant}
            onChange={() => toggle(variant)}
            size="xs"
          >
            {DUE_LABELS[variant]}
          </Chip>
        ))}
      </Group>
    </Stack>
  );
};

export const FilterDueField = memo(FilterDueFieldComponent);
