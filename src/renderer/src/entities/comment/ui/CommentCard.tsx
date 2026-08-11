import { ActionIcon, Group, Menu, Paper, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import {
  DeleteIcon,
  DownloadIcon,
  FileTextIcon,
  MenuIcon,
  SquarePenIcon,
} from "lucide-animated";
import type { FC } from "react";
import type { CommentDTO } from "@/main/comments";

type CommentCardProps = {
  comment: CommentDTO;
  onEdit: () => void;
  onDelete: () => void;
  onDownloadAttachment: () => void;
};

export const CommentCard: FC<CommentCardProps> = ({
  comment,
  onEdit,
  onDelete,
  onDownloadAttachment,
}) => (
  <Paper withBorder p="sm" radius="sm">
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Text size="xs" c="dimmed">
        {dayjs(comment.postedAt).format("MMM D, YYYY HH:mm")}
      </Text>

      <Menu withinPortal position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label="Comment actions"
          >
            <MenuIcon size={14} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item leftSection={<SquarePenIcon size={14} />} onClick={onEdit}>
            Edit
          </Menu.Item>
          <Menu.Item
            color="red"
            leftSection={<DeleteIcon size={14} />}
            onClick={onDelete}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>

    <Stack gap="xs">
      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
        {comment.content}
      </Text>

      {comment.attachment && (
        <Paper withBorder radius="sm" p={6}>
          <Group gap={6} wrap="nowrap" justify="space-between">
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
              <FileTextIcon size={14} animateOnHover={false} />
              <Text size="xs" c="dimmed" truncate>
                {comment.attachment.fileName ?? "Attachment"}
              </Text>
            </Group>

            {comment.attachment.fileUrl ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label={`Download ${comment.attachment.fileName ?? "attachment"}`}
                onClick={onDownloadAttachment}
              >
                <DownloadIcon size={14} animateOnHover={false} />
              </ActionIcon>
            ) : (
              <Text size="xs" c="dimmed">
                Uploading...
              </Text>
            )}
          </Group>
        </Paper>
      )}
    </Stack>
  </Paper>
);
