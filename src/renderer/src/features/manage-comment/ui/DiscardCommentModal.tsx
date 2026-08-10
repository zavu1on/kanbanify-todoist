import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { FC } from "react";

type DiscardCommentModalProps = {
  opened: boolean;
  onCancel: () => void;
  onDiscard: () => void;
};

export const DiscardCommentModal: FC<DiscardCommentModalProps> = ({
  opened,
  onCancel,
  onDiscard,
}) => (
  <Modal opened={opened} onClose={onCancel} title="Discard comment?" size="sm">
    <Stack gap="md">
      <Text size="sm">
        Are you sure you want to close this form? Your comment will not be
        saved.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Keep editing
        </Button>
        <Button color="red" onClick={onDiscard}>
          Discard
        </Button>
      </Group>
    </Stack>
  </Modal>
);
