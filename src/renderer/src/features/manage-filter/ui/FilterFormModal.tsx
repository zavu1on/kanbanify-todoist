import {
  Button,
  Center,
  Chip,
  Group,
  Loader,
  Modal,
  Paper,
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
import {
  buildFilterQuery,
  DUE_VARIANTS,
  type DueVariant,
  parseFilterQuery,
} from "@/entities/filter";
import { useLabelsQuery } from "@/entities/label";
import {
  getProjectColorHex,
  PROJECT_COLOR_OPTIONS,
  useProjectsQuery,
} from "@/entities/project";
import type { FilterDTO } from "@/main/filters";
import type { ProjectDTO } from "@/main/projects";
import { PRIORITY_LEVELS } from "@/main/tasks";
import { useCreateFilterMutation } from "../api/useCreateFilterMutation";
import { useUpdateFilterMutation } from "../api/useUpdateFilterMutation";
import { filterFormSchema } from "../model/filterFormSchema";

type FilterFormModalProps = {
  opened: boolean;
  onClose: () => void;
  /** Absent in create mode. */
  filter?: FilterDTO;
};

const DUE_LABELS: Record<DueVariant, string> = {
  today_overdue: "Today + Overdue",
  today: "Today",
  next_7_days: "Next 7 days",
  no_date: "No date",
};

const colorSwatch = (color: string) => (
  <Paper radius="xl" w={12} h={12} bg={getProjectColorHex(color)} />
);

/**
 * Outer shell: fetches projects/labels and only mounts `FilterForm` once the
 * projects list is ready (in edit mode). Resolving the saved query's
 * `#ProjectName` back to a `Select`-usable `projectId` (see `FilterForm`)
 * only happens once, at `useForm`'s `initialValues` — mounting the form
 * before `projects` has loaded would permanently lock the project field to
 * "unselected", since a later-arriving project list can't retroactively
 * patch a form's initial values.
 */
export const FilterFormModal: FC<FilterFormModalProps> = ({
  opened,
  onClose,
  filter,
}) => {
  const isEditMode = filter !== undefined;
  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data?.ok ? projectsQuery.data.projects : [];
  const labelsQuery = useLabelsQuery();
  const labelOptions = labelsQuery.data?.ok
    ? labelsQuery.data.labels.map((label) => label.name)
    : [];

  if (isEditMode && projectsQuery.isPending) {
    return (
      <Modal opened={opened} onClose={onClose} title="Edit filter">
        <Center py="lg">
          <Loader />
        </Center>
      </Modal>
    );
  }

  return (
    <FilterForm
      opened={opened}
      onClose={onClose}
      filter={filter}
      projects={projects}
      labelOptions={labelOptions}
    />
  );
};

type FilterFormProps = {
  opened: boolean;
  onClose: () => void;
  filter?: FilterDTO;
  projects: ProjectDTO[];
  labelOptions: string[];
};

const FilterForm: FC<FilterFormProps> = ({
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

  // `mode: "controlled"` (unlike `ProjectFormModal`) so `form.values` stays
  // reactive without hand-wiring `form.watch` per field — needed for the
  // live `query=` preview below, which reads every field at once.
  const form = useForm({
    mode: "controlled",
    initialValues: {
      title: filter?.title ?? "",
      color: filter?.color ?? "charcoal",
      projectId: initialProjectId,
      priorities: parsedQuery?.priorities ?? [],
      due: parsedQuery?.due ?? (isEditMode ? null : "today_overdue"),
      labels: parsedQuery?.labels ?? [],
      conjunction: parsedQuery?.conjunction ?? "and",
    },
    validate: schemaResolver(filterFormSchema, { sync: true }),
  });

  const selectedProjectName =
    projects.find((p) => p.id === form.values.projectId)?.name ?? null;
  const previewQuery = buildFilterQuery({
    projectName: selectedProjectName,
    priorities: form.values.priorities,
    due: form.values.due,
    labels: form.values.labels,
    conjunction: form.values.conjunction,
  });

  const requestClose = () => {
    if (form.isDirty()) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    onClose();
  };

  const toggleDue = (value: DueVariant) => {
    form.setFieldValue("due", form.values.due === value ? null : value);
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
            {...form.getInputProps("title")}
          />

          <Select
            label="Color"
            data={[...PROJECT_COLOR_OPTIONS]}
            leftSection={colorSwatch(form.values.color)}
            renderOption={({ option }) => (
              <Group gap="xs">
                {colorSwatch(option.value)}
                {option.label}
              </Group>
            )}
            allowDeselect={false}
            {...form.getInputProps("color")}
          />

          <Select
            label="Project"
            placeholder="Any project"
            data={projects.map((p) => ({ value: p.id, label: p.name }))}
            searchable
            clearable
            {...form.getInputProps("projectId")}
          />

          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Priority
            </Text>
            <Chip.Group
              multiple
              value={form.values.priorities}
              onChange={(value) => form.setFieldValue("priorities", value)}
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

          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Due
            </Text>
            <Group gap={6}>
              {DUE_VARIANTS.map((variant) => (
                <Chip
                  key={variant}
                  checked={form.values.due === variant}
                  onChange={() => toggleDue(variant)}
                  size="xs"
                >
                  {DUE_LABELS[variant]}
                </Chip>
              ))}
            </Group>
          </Stack>

          <TagsInput
            label="Labels"
            placeholder="Search or add a label"
            data={labelOptions}
            {...form.getInputProps("labels")}
          />

          <Radio.Group label="Match" {...form.getInputProps("conjunction")}>
            <Group gap="xs" mt={4}>
              <Radio value="and" label="All conditions (AND)" />
              <Radio value="or" label="Any condition (OR)" />
            </Group>
          </Radio.Group>

          <Text size="xs" c="dimmed" ff="monospace">
            query={previewQuery}
          </Text>

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
