import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { FC } from "react";
import type { FilterDTO } from "@/main/filters";
import { useDeleteFilterMutation } from "../api/useDeleteFilterMutation";
import { getFilterErrorMessage } from "../model/getFilterErrorMessage";

type DeleteFilterModalProps = {
  opened: boolean;
  onClose: () => void;
  filter: FilterDTO;
};

/** Single-step, unlike `DeleteProjectModal` — deleting a filter has no
 * cascading effect on any task (see `useDeleteFilterMutation`), so it
 * doesn't need the same two-step "this can't be undone" confirmation. */
export const DeleteFilterModal: FC<DeleteFilterModalProps> = ({
  opened,
  onClose,
  filter,
}) => {
  const deleteMutation = useDeleteFilterMutation();

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync(filter.id);

    if (!result.ok) {
      notifications.show({
        color: "red",
        title: "Couldn't delete filter",
        message: getFilterErrorMessage(result.error.type),
      });
      return;
    }

    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete filter?">
      <Stack gap="md">
        <Text size="sm">
          Deleting "{filter.title}" only removes the filter itself — the tasks
          it matches aren't affected.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            Delete filter
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
