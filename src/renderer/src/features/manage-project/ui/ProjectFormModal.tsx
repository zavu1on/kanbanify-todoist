import {
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { type FC, useState } from "react";
import {
  getProjectColorHex,
  PROJECT_COLOR_OPTIONS,
  useProjectsQuery,
} from "@/entities/project";
import type { ProjectDTO } from "@/main/projects";
import { useCreateProjectMutation } from "../api/useCreateProjectMutation";
import { useUpdateProjectMutation } from "../api/useUpdateProjectMutation";
import { NO_PARENT_VALUE, projectFormSchema } from "../model/projectFormSchema";

type ProjectFormModalProps = {
  opened: boolean;
  onClose: () => void;
  /** Absent in create mode. In edit mode, the parent project can't be
   * changed here (see `Project.updateDetails`), only shown for context. */
  project?: ProjectDTO;
};

const colorSwatch = (color: string) => (
  <Paper radius="xl" w={12} h={12} bg={getProjectColorHex(color)} />
);

export const ProjectFormModal: FC<ProjectFormModalProps> = ({
  opened,
  onClose,
  project,
}) => {
  const isEditMode = project !== undefined;
  // Mounted fresh on every open (see `ProjectActionsMenu`), so this always
  // starts closed — no reset effect needed.
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data?.ok ? projectsQuery.data.projects : [];
  const parentProject = project
    ? projects.find((p) => p.id === project.parentId)
    : undefined;

  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();

  const form = useForm({
    initialValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      color: project?.color ?? "charcoal",
      parentId: project?.parentId ?? NO_PARENT_VALUE,
    },
    validate: schemaResolver(projectFormSchema, { sync: true }),
  });

  const requestClose = () => {
    if (form.isDirty()) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    onClose();
  };

  // Optimistic: fire the mutation and close right away instead of waiting
  // for the IPC round trip — the caller (`useCreateProjectMutation` /
  // `useUpdateProjectMutation`) writes the change into the cache immediately,
  // rolls it back, and shows an error notification if the call fails. The
  // form is gone by then, so success/failure feedback lives entirely in the
  // mutation hooks, not here.
  const handleSubmit = form.onSubmit(
    (values) => {
      if (isEditMode) {
        updateMutation.mutate({
          id: project.id,
          input: {
            name: values.name.trim(),
            description: values.description.trim(),
            color: values.color,
          },
        });
      } else {
        createMutation.mutate({
          name: values.name.trim(),
          description: values.description.trim(),
          color: values.color,
          parentId:
            values.parentId === NO_PARENT_VALUE ? null : values.parentId,
        });
      }
      onClose();
    },
    (errors) => {
      // Without this, a validation failure on a field not rendered in this
      // mode (e.g. `parentId`, hidden in edit mode) blocks submission with
      // zero feedback — Mantine only auto-shows errors on bound inputs.
      const firstError = Object.values(errors)[0];
      notifications.show({
        color: "red",
        title: isEditMode ? "Couldn't save project" : "Couldn't add project",
        message:
          typeof firstError === "string"
            ? firstError
            : "Please check the form for errors.",
      });
    },
  );

  const parentOptions = [
    { value: NO_PARENT_VALUE, label: "No parent" },
    ...projects
      .filter((p) => p.id !== project?.id)
      .map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <Modal
      opened={opened}
      onClose={requestClose}
      title={isEditMode ? "Edit project" : "Add project"}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Project name"
            maxLength={120}
            data-autofocus
            {...form.getInputProps("name")}
          />

          <Textarea
            label="Description"
            placeholder="Add a description"
            minRows={2}
            {...form.getInputProps("description")}
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

          {isEditMode ? (
            <TextInput
              label="Parent project"
              description="The parent project can only be changed in the original Todoist app."
              value={parentProject?.name ?? "No parent"}
              readOnly
              disabled
            />
          ) : (
            <Select
              label="Parent project"
              data={parentOptions}
              searchable
              allowDeselect={false}
              {...form.getInputProps("parentId")}
            />
          )}

          <Group justify="flex-end">
            <Button type="button" variant="default" onClick={requestClose}>
              Cancel
            </Button>
            <Button
              // `type="button"` (not "submit") — submission goes exclusively
              // through the explicit `requestSubmit()` below. A `type="submit"`
              // button here double-fired `handleSubmit` per click in some
              // environments (native submit + this handler), which used to be
              // harmless (duplicate `invalidateQueries` calls) but would
              // double-fire the optimistic mutation above.
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
