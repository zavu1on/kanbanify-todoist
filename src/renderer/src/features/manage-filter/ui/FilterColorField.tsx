import { Group, Paper, Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { memo, type FC, useState } from "react";
import { getProjectColorHex, PROJECT_COLOR_OPTIONS } from "@/entities/project";
import type { FilterFormValues } from "../model/filterFormSchema";

const colorSwatch = (color: string) => (
  <Paper radius="xl" w={12} h={12} bg={getProjectColorHex(color)} />
);

// Spread once at module scope: `Select`'s `data` prop wants a mutable
// array, `PROJECT_COLOR_OPTIONS` is `as const` — same fix the original
// inline `[...PROJECT_COLOR_OPTIONS]` made, just not recomputed every render.
const COLOR_OPTIONS = [...PROJECT_COLOR_OPTIONS];

type FilterColorFieldProps = {
  form: UseFormReturnType<FilterFormValues>;
};

const FilterColorFieldComponent: FC<FilterColorFieldProps> = ({ form }) => {
  // Local state (not `FilterForm`'s): the swatch preview needs a live read
  // of this field, same as `ProjectFormModal`'s `color` state — kept here
  // so only this field re-renders when color changes, not the whole modal
  // (header, Submit button).
  const [color, setColor] = useState(form.getValues().color);
  form.watch("color", ({ value }) => setColor(value));

  return (
    <Select
      label="Color"
      data={COLOR_OPTIONS}
      leftSection={colorSwatch(color)}
      renderOption={({ option }) => (
        <Group gap="xs">
          {colorSwatch(option.value)}
          {option.label}
        </Group>
      )}
      allowDeselect={false}
      key={form.key("color")}
      {...form.getInputProps("color")}
    />
  );
};

export const FilterColorField = memo(FilterColorFieldComponent);
