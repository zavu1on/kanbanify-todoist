import {
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import type { FC } from "react";
import {
  getProjectColorHex,
  PROJECT_COLOR_OPTIONS,
  useProjectsQuery,
} from "@/entities/project";
import type { ProjectDTO } from "@/main/projects";
import { useCreateProjectMutation } from "../api/useCreateProjectMutation";
import { useUpdateProjectMutation } from "../api/useUpdateProjectMutation";
import { getProjectErrorMessage } from "../model/getProjectErrorMessage";
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
  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data?.ok ? projectsQuery.data.projects : [];
  const parentProject = project
    ? projects.find((p) => p.id === project.parentId)
    : undefined;

  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm({
    initialValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      color: project?.color ?? "charcoal",
      parentId: project?.parentId ?? NO_PARENT_VALUE,
    },
    validate: schemaResolver(projectFormSchema, { sync: true }),
  });

  const handleSubmit = form.onSubmit(
    async (values) => {
      try {
        const result = isEditMode
          ? await updateMutation.mutateAsync({
              id: project.id,
              input: {
                name: values.name.trim(),
                description: values.description.trim(),
                color: values.color,
              },
            })
          : await createMutation.mutateAsync({
              name: values.name.trim(),
              description: values.description.trim(),
              color: values.color,
              parentId:
                values.parentId === NO_PARENT_VALUE ? null : values.parentId,
            });

        if (!result.ok) {
          if (result.error.type === "invalid_name") {
            form.setFieldError(
              "name",
              getProjectErrorMessage(result.error.type),
            );
            return;
          }
          notifications.show({
            color: "red",
            title: isEditMode
              ? "Couldn't save project"
              : "Couldn't add project",
            message: getProjectErrorMessage(result.error.type),
          });
          return;
        }

        notifications.show({
          color: "green",
          title: isEditMode ? "Project updated" : "Project added",
          message: `"${result.project.name}" ${isEditMode ? "was updated" : "was added"}.`,
        });
        onClose();
      } catch {
        // A rejected `mutateAsync` (rather than an `{ ok: false }` result) means
        // the IPC call itself failed unexpectedly — surface it instead of
        // leaving the user staring at a button that silently did nothing.
        notifications.show({
          color: "red",
          title: isEditMode ? "Couldn't save project" : "Couldn't add project",
          message: "Something went wrong. Please try again.",
        });
      }
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
      onClose={onClose}
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
            <Button type="button" variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              // A click on this button doesn't reach the browser's native
              // click-to-submit behavior in this environment (verified via
              // devtools: the click's default action ends up prevented
              // before it reaches the form), so trigger submission
              // explicitly instead of relying on it.
              onClick={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {isEditMode ? "Save" : "Add"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
