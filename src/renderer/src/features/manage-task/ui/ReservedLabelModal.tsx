import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { FC } from "react";
import { KANBAN_COLUMN_LABELS } from "@/entities/task";
import type { KanbanStatusLevel } from "@/main/tasks";

type ReservedLabelModalProps = {
  /** The reserved label the user tried to add — `null` keeps the modal
   * closed, same "open iff a target exists" pattern as the pick it confirms. */
  pendingLabel: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ReservedLabelModal: FC<ReservedLabelModalProps> = ({
  pendingLabel,
  onCancel,
  onConfirm,
}) => (
  <Modal
    opened={pendingLabel !== null}
    onClose={onCancel}
    title="Reserved label"
    size="sm"
  >
    <Stack gap="md">
      <Text size="sm">
        "{pendingLabel}" is a reserved kanban label. Adding it will set this
        task's kanban status to "
        {pendingLabel &&
          KANBAN_COLUMN_LABELS[pendingLabel.toLowerCase() as KanbanStatusLevel]}
        " instead of adding a regular label.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Set status</Button>
      </Group>
    </Stack>
  </Modal>
);
