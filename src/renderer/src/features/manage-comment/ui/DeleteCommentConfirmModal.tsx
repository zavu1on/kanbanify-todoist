import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { FC } from "react";

type DeleteCommentConfirmModalProps = {
  opened: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const DeleteCommentConfirmModal: FC<DeleteCommentConfirmModalProps> = ({
  opened,
  onCancel,
  onConfirm,
}) => (
  <Modal opened={opened} onClose={onCancel} title="Delete comment?" size="sm">
    <Stack gap="md">
      <Text size="sm">
        This comment will be permanently deleted. This action cannot be undone.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm}>
          Delete
        </Button>
      </Group>
    </Stack>
  </Modal>
);
