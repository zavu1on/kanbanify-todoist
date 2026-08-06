import { Alert, Button, Group, List, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { FC } from "react";
import { useState } from "react";
import type { ProjectDTO } from "@/main/projects";
import { useDeleteProjectMutation } from "../api/useDeleteProjectMutation";
import { getProjectErrorMessage } from "../model/getProjectErrorMessage";

type DeleteProjectModalProps = {
  opened: boolean;
  onClose: () => void;
  project: ProjectDTO;
};

export const DeleteProjectModal: FC<DeleteProjectModalProps> = ({
  opened,
  onClose,
  project,
}) => {
  // Mounted fresh on every open (see `ProjectActionsMenu`), so `step` always
  // starts at 1 — no reset effect needed.
  const [step, setStep] = useState<1 | 2>(1);
  const deleteMutation = useDeleteProjectMutation();

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync(project.id);

    if (!result.ok) {
      notifications.show({
        color: "red",
        title: "Couldn't delete project",
        message: getProjectErrorMessage(result.error.type),
      });
      return;
    }

    notifications.show({
      color: "green",
      title: "Project deleted",
      message: `"${project.name}" and all of its tasks were permanently deleted.`,
    });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete project?">
      <Stack gap="md">
        {step === 1 ? (
          <>
            <Text size="sm">Deleting "{project.name}" will:</Text>
            <List size="sm" spacing="xs">
              <List.Item>
                Permanently delete the project and every task inside it
              </List.Item>
              <List.Item>Remove it from the sidebar and kanban board</List.Item>
              <List.Item>Not be recoverable — there is no undo</List.Item>
            </List>
            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>
                Cancel
              </Button>
              <Button color="red" onClick={() => setStep(2)}>
                Continue
              </Button>
            </Group>
          </>
        ) : (
          <>
            <Alert color="red" title="This can't be undone">
              This will permanently delete "{project.name}" and all of its
              tasks.
            </Alert>
            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>
                Cancel
              </Button>
              <Button
                color="red"
                loading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                Delete project
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};
