import type { UseFormReturnType } from "@mantine/form";
import { useState } from "react";
import type { FilterFieldKey } from "@/entities/filter";
import type { FilterFormValues } from "./filterFormSchema";

const isDefined = (value: unknown): boolean =>
  value !== null && !(Array.isArray(value) && value.length === 0);

const toKeys = (values: FilterFormValues): FilterFieldKey[] => {
  const defined: Record<FilterFieldKey, boolean> = {
    project: isDefined(values.projectId),
    priorities: isDefined(values.priorities),
    due: isDefined(values.due),
    labels: isDefined(values.labels),
    kanbanStatus: isDefined(values.kanbanStatus),
  };
  return (Object.keys(defined) as FilterFieldKey[]).filter(
    (key) => defined[key],
  );
};

/** Which fields currently have a value, in query order — kept in the
 * caller's own state via `form.watch` (see `FilterFieldControls`) so it
 * doesn't re-render `FilterForm`. */
export const useDefinedFilterFields = (
  form: UseFormReturnType<FilterFormValues>,
): FilterFieldKey[] => {
  const [values, setValues] = useState(() => form.getValues());
  form.watch("projectId", ({ value }) =>
    setValues((v) => ({ ...v, projectId: value })),
  );
  form.watch("priorities", ({ value }) =>
    setValues((v) => ({ ...v, priorities: value })),
  );
  form.watch("due", ({ value }) => setValues((v) => ({ ...v, due: value })));
  form.watch("labels", ({ value }) =>
    setValues((v) => ({ ...v, labels: value })),
  );
  form.watch("kanbanStatus", ({ value }) =>
    setValues((v) => ({ ...v, kanbanStatus: value })),
  );
  return toKeys(values);
};
