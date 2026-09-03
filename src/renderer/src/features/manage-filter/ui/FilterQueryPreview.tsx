import { Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { memo, type FC, useState } from "react";
import { buildFilterQuery } from "@/entities/filter";
import type { ProjectDTO } from "@/main/projects";
import type { FilterFormValues } from "../model/filterFormSchema";

type FilterQueryPreviewProps = {
  form: UseFormReturnType<FilterFormValues>;
  projects: ProjectDTO[];
};

// Mirrors every field `buildFilterQuery` reads into its own local state via
// `form.watch`, kept out of `FilterForm` itself. This preview legitimately
// needs to re-render on nearly every keystroke — if that state lived in
// `FilterForm` instead, it would drag the whole modal (header, Submit
// button) along with it, the exact problem `mode: "uncontrolled"` exists to
// avoid.
const FilterQueryPreviewComponent: FC<FilterQueryPreviewProps> = ({
  form,
  projects,
}) => {
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
  form.watch("conjunction", ({ value }) =>
    setValues((v) => ({ ...v, conjunction: value })),
  );

  const projectName =
    projects.find((p) => p.id === values.projectId)?.name ?? null;
  const query = buildFilterQuery({
    projectName,
    priorities: values.priorities,
    due: values.due,
    labels: values.labels,
    conjunction: values.conjunction,
  });

  return (
    <Text size="xs" c="dimmed" ff="monospace">
      query={query}
    </Text>
  );
};

export const FilterQueryPreview = memo(FilterQueryPreviewComponent);
