import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { FC } from "react";

type MoveOverdueToTodayConfirmModalProps = {
  opened: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export const MoveOverdueToTodayConfirmModal: FC<
  MoveOverdueToTodayConfirmModalProps
> = ({ opened, count, onCancel, onConfirm }) => (
  <Modal
    opened={opened}
    onClose={onCancel}
    title="Move all to today?"
    size="sm"
  >
    <Stack gap="md">
      <Text size="sm">
        {count} overdue task{count === 1 ? "" : "s"} will be rescheduled to
        today.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Move to today</Button>
      </Group>
    </Stack>
  </Modal>
);
