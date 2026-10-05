import { Checkbox, Group, Select, SegmentedControl } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { memo, type FC } from "react";
import type { FilterFieldKey } from "@/entities/filter";
import type { FilterFormValues } from "../model/filterFormSchema";
import { useDefinedFilterFields } from "../model/useDefinedFilterFields";

const CONJUNCTION_OPTIONS = [
  { label: "AND", value: "and" },
  { label: "OR", value: "or" },
];

type FilterFieldControlsProps = {
  form: UseFormReturnType<FilterFormValues>;
  field: FilterFieldKey;
};

// Sits to the right of a field: AND/OR joining it to the next defined field
// (not for the always-last Kanban status), that operator's precedence (only
// once there are ≥2 operators — with one, there's nothing to order) and a NOT
// checkbox. All are meaningless — so disabled — while the field itself is
// empty. Own `useState` + `form.watch` (in the hook) keeps the reads out of
// `FilterForm` (see there).
const FilterFieldControlsComponent: FC<FilterFieldControlsProps> = ({
  form,
  field,
}) => {
  const defined = useDefinedFilterFields(form);
  const isEmpty = !defined.includes(field);
  const operatorCount = defined.length - 1;
  const hasOperator = field !== "kanbanStatus" && defined.at(-1) !== field;
  const showPrecedence = !isEmpty && hasOperator && operatorCount >= 2;

  return (
    <Group gap="sm" wrap="nowrap" align="center" pb={4}>
      {field !== "kanbanStatus" && (
        <SegmentedControl
          size="xs"
          data={CONJUNCTION_OPTIONS}
          disabled={isEmpty}
          aria-label={`${field} conjunction`}
          key={form.key(`next.${field}`)}
          {...form.getInputProps(`next.${field}`)}
        />
      )}
      {field !== "kanbanStatus" && showPrecedence && (
        <Select
          size="xs"
          w={76}
          aria-label={`${field} precedence`}
          allowDeselect={false}
          data={[
            { value: "auto", label: "Auto" },
            ...Array.from({ length: operatorCount }, (_, i) => ({
              value: String(i + 1),
              label: String(i + 1),
            })),
          ]}
          key={form.key(`prec.${field}`)}
          {...form.getInputProps(`prec.${field}`)}
        />
      )}
      <Checkbox
        size="xs"
        label="NOT"
        disabled={isEmpty}
        key={form.key(`negated.${field}`)}
        {...form.getInputProps(`negated.${field}`, { type: "checkbox" })}
      />
    </Group>
  );
};

export const FilterFieldControls = memo(FilterFieldControlsComponent);
