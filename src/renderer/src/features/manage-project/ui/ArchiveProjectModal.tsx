import { Alert, Button, Group, List, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { FC } from "react";
import { useState } from "react";
import type { ProjectDTO } from "@/main/projects";
import { useArchiveProjectMutation } from "../api/useArchiveProjectMutation";
import { getProjectErrorMessage } from "../model/getProjectErrorMessage";

type ArchiveProjectModalProps = {
  opened: boolean;
  onClose: () => void;
  project: ProjectDTO;
};

/** Todoist's community-tier API has no `unarchive` this app exposes — restoring
 * an archived project is only possible from the original Todoist app. */
export const ArchiveProjectModal: FC<ArchiveProjectModalProps> = ({
  opened,
  onClose,
  project,
}) => {
  // Mounted fresh on every open (see `ProjectActionsMenu`), so `step` always
  // starts at 1 — no reset effect needed.
  const [step, setStep] = useState<1 | 2>(1);
  const archiveMutation = useArchiveProjectMutation();

  const handleArchive = async () => {
    const result = await archiveMutation.mutateAsync(project.id);

    if (!result.ok) {
      notifications.show({
        color: "red",
        title: "Couldn't archive project",
        message: getProjectErrorMessage(result.error.type),
      });
      return;
    }

    notifications.show({
      color: "green",
      title: "Project archived",
      message: `"${project.name}" was archived. You can restore it from the original Todoist app.`,
      autoClose: false,
    });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Archive project?">
      <Stack gap="md">
        {step === 1 ? (
          <>
            <Text size="sm">Archiving "{project.name}" will:</Text>
            <List size="sm" spacing="xs">
              <List.Item>
                Hide it from the sidebar, task lists and the kanban board
              </List.Item>
              <List.Item>Keep all of its tasks, unchanged</List.Item>
              <List.Item>
                Only be reversible from the original Todoist app — this app
                can't unarchive it
              </List.Item>
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
            <Alert color="red" title="Are you sure?">
              This will archive "{project.name}". You'll need the original
              Todoist app to bring it back.
            </Alert>
            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>
                Cancel
              </Button>
              <Button
                color="red"
                loading={archiveMutation.isPending}
                onClick={handleArchive}
              >
                Archive project
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};
