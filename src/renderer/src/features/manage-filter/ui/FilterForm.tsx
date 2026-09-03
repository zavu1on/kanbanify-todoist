import {
  Button,
  Chip,
  Group,
  Modal,
  Radio,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { type FC, useState } from "react";
import { buildFilterQuery, parseFilterQuery } from "@/entities/filter";
import type { FilterDTO } from "@/main/filters";
import type { ProjectDTO } from "@/main/projects";
import { PRIORITY_LEVELS, type PriorityLevel } from "@/main/tasks";
import { useCreateFilterMutation } from "../api/useCreateFilterMutation";
import { useUpdateFilterMutation } from "../api/useUpdateFilterMutation";
import { filterFormSchema } from "../model/filterFormSchema";
import { FilterColorField } from "./FilterColorField";
import { FilterDueField } from "./FilterDueField";
import { FilterQueryPreview } from "./FilterQueryPreview";

// Hoisted: `schemaResolver` doesn't close over anything component-specific,
// so a fresh call per render only exists to defeat memoization.
const validateFilterForm = schemaResolver(filterFormSchema, { sync: true });

type FilterFormProps = {
  opened: boolean;
  onClose: () => void;
  filter?: FilterDTO;
  projects: ProjectDTO[];
  labelOptions: string[];
};

export const FilterForm: FC<FilterFormProps> = ({
  opened,
  onClose,
  filter,
  projects,
  labelOptions,
}) => {
  const isEditMode = filter !== undefined;
  // Mounted fresh on every open (see `FilterActionsMenu`), so this always
  // starts closed — no reset effect needed.
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const createMutation = useCreateFilterMutation();
  const updateMutation = useUpdateFilterMutation();

  // Only the three fields that get persisted (title/color/query) are
  // stored — the structured project/priority/due/labels selections below
  // exist only in this form, rebuilt on open by parsing the saved query
  // back apart (`parseFilterQuery` is the exact inverse of `buildFilterQuery`,
  // which is what generated it in the first place).
  const parsedQuery = filter ? parseFilterQuery(filter.query) : null;
  const initialProjectId = parsedQuery?.projectName
    ? (projects.find((p) => p.name === parsedQuery.projectName)?.id ?? null)
    : null;

  // `mode: "uncontrolled"` (see `ProjectFormModal`) keeps field values out
  // of this component's React state, so typing doesn't re-render this
  // modal — only the input that calls `form.getInputProps` for the changed
  // field updates, via its own uncontrolled DOM state. Most fields below
  // are inlined here since that costs nothing — this component doesn't
  // re-render on their edit either way. `FilterColorField`, `FilterDueField`
  // and `FilterQueryPreview` stay as separate components: each needs a live
  // read of one or more fields (`form.watch`) backed by its own local
  // `useState` — inlining them would move that state onto this component,
  // and the header/Submit button below would start re-rendering on every
  // edit again, the exact thing `mode: "uncontrolled"` avoids.
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      title: filter?.title ?? "",
      color: filter?.color ?? "charcoal",
      projectId: initialProjectId,
      priorities: parsedQuery?.priorities ?? [],
      due: parsedQuery?.due ?? (isEditMode ? null : "today_overdue"),
      labels: parsedQuery?.labels ?? [],
      conjunction: parsedQuery?.conjunction ?? "and",
    },
    validate: validateFilterForm,
  });

  const requestClose = () => {
    if (form.isDirty()) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    onClose();
  };

  // Optimistic: fire the mutation and close right away — see `ProjectFormModal`
  // for the same pattern (and why success/failure feedback lives in the
  // mutation hooks, not here).
  const handleSubmit = form.onSubmit(
    (values) => {
      const projectName =
        projects.find((p) => p.id === values.projectId)?.name ?? null;
      const input = {
        title: values.title.trim(),
        color: values.color,
        query: buildFilterQuery({
          projectName,
          priorities: values.priorities,
          due: values.due,
          labels: values.labels,
          conjunction: values.conjunction,
        }),
      };

      if (isEditMode) {
        updateMutation.mutate({ id: filter.id, input });
      } else {
        createMutation.mutate(input);
      }
      onClose();
    },
    (errors) => {
      const firstError = Object.values(errors)[0];
      notifications.show({
        color: "red",
        title: isEditMode ? "Couldn't save filter" : "Couldn't add filter",
        message:
          typeof firstError === "string"
            ? firstError
            : "Please check the form for errors.",
      });
    },
  );

  const { onChange: onPrioritiesChange, ...prioritiesInputProps } =
    form.getInputProps("priorities");

  return (
    <Modal
      opened={opened}
      onClose={requestClose}
      title={isEditMode ? "Edit filter" : "Add filter"}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Filter title"
            maxLength={120}
            data-autofocus
            key={form.key("title")}
            {...form.getInputProps("title")}
          />

          <FilterColorField form={form} />

          <Select
            label="Project"
            placeholder="Any project"
            data={projects.map((p) => ({ value: p.id, label: p.name }))}
            searchable
            clearable
            key={form.key("projectId")}
            {...form.getInputProps("projectId")}
          />

          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Priority
            </Text>
            <Chip.Group
              multiple
              key={form.key("priorities")}
              {...prioritiesInputProps}
              onChange={(value) => onPrioritiesChange(value as PriorityLevel[])}
            >
              <Group gap={6}>
                {PRIORITY_LEVELS.map((level) => (
                  <Chip key={level} value={level} size="xs">
                    {level.toUpperCase()}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </Stack>

          <FilterDueField form={form} />

          <TagsInput
            label="Labels"
            placeholder="Search or add a label"
            data={labelOptions}
            key={form.key("labels")}
            {...form.getInputProps("labels")}
          />

          <Radio.Group
            label="Match"
            key={form.key("conjunction")}
            {...form.getInputProps("conjunction")}
          >
            <Group gap="xs" mt={4}>
              <Radio value="and" label="All conditions (AND)" />
              <Radio value="or" label="Any condition (OR)" />
            </Group>
          </Radio.Group>

          <FilterQueryPreview form={form} projects={projects} />

          <Group justify="flex-end">
            <Button type="button" variant="default" onClick={requestClose}>
              Cancel
            </Button>
            <Button
              // See `ProjectFormModal` — `type="button"` + explicit
              // `requestSubmit()` avoids a double-fired submit.
              type="button"
              onClick={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {isEditMode ? "Save" : "Add"}
            </Button>
          </Group>
        </Stack>
      </form>

      <Modal
        opened={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        title="Discard changes?"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            You have unsaved changes. Closing now will discard them.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setIsDiscardConfirmOpen(false)}
            >
              Keep editing
            </Button>
            <Button color="red" onClick={onClose}>
              Discard
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  );
};
