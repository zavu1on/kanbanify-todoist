import { Button, Divider, Stack, Text } from "@mantine/core";
import { PlusIcon } from "lucide-animated";
import { type FC, memo, useState } from "react";
import { CommentCard, useCommentsQuery } from "@/entities/comment";
import { useCreateCommentMutation } from "../api/useCreateCommentMutation";
import { useDeleteCommentMutation } from "../api/useDeleteCommentMutation";
import { useDownloadAttachmentMutation } from "../api/useDownloadAttachmentMutation";
import { useUpdateCommentMutation } from "../api/useUpdateCommentMutation";
import type { CommentFormAttachmentChange } from "../model/attachmentChange";
import { CommentForm } from "./CommentForm";
import { DeleteCommentConfirmModal } from "./DeleteCommentConfirmModal";

type CommentsSectionProps = {
  taskId: string;
};

/**
 * A task's comments — list of cards plus the inline add/edit form (see
 * COMMENTS.md). Mirrors `SubtasksSection`'s composition: query + mutations
 * owned here, `CommentCard`/`CommentForm` stay presentational. `memo`d so
 * `TaskFormFrame` re-rendering while typing the title (see
 * `useQuickAddTitleSync`'s `rawTitle` state) doesn't also re-run this
 * section's own comments query.
 */
const CommentsSectionComponent: FC<CommentsSectionProps> = ({ taskId }) => {
  const commentsQuery = useCommentsQuery(taskId);
  const createMutation = useCreateCommentMutation(taskId);
  const updateMutation = useUpdateCommentMutation(taskId);
  const deleteMutation = useDeleteCommentMutation(taskId);
  const downloadMutation = useDownloadAttachmentMutation();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const result = commentsQuery.data;
  const comments = result?.ok ? result.comments : [];

  const handleCreateSubmit = (
    content: string,
    attachmentChange: CommentFormAttachmentChange,
  ) => {
    setIsAdding(false);
    createMutation.mutate({
      content,
      file:
        attachmentChange.type === "replace" ? attachmentChange.file : undefined,
    });
  };

  const handleUpdateSubmit = (
    commentId: string,
    content: string,
    attachmentChange: CommentFormAttachmentChange,
  ) => {
    setEditingId(null);
    updateMutation.mutate({ commentId, content, attachmentChange });
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) deleteMutation.mutate({ commentId: pendingDeleteId });
    setPendingDeleteId(null);
  };

  return (
    <Stack gap="xs">
      <Divider
        label={
          commentsQuery.isPending ? "Comments" : `Comments ${comments.length}`
        }
        labelPosition="left"
      />

      {commentsQuery.isPending ? (
        <Text size="sm" c="dimmed">
          Loading...
        </Text>
      ) : result && !result.ok ? (
        <Text size="sm" c="red">
          {result.error.message}
        </Text>
      ) : (
        comments.map((comment) =>
          editingId === comment.id ? (
            <CommentForm
              key={comment.id}
              mode="edit"
              initialContent={comment.content}
              initialAttachment={comment.attachment}
              isSubmitting={updateMutation.isPending}
              onSubmit={(content, attachmentChange) =>
                handleUpdateSubmit(comment.id, content, attachmentChange)
              }
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <CommentCard
              key={comment.id}
              comment={comment}
              onEdit={() => setEditingId(comment.id)}
              onDelete={() => setPendingDeleteId(comment.id)}
              onDownloadAttachment={() =>
                comment.attachment?.fileUrl &&
                downloadMutation.mutate({
                  fileUrl: comment.attachment.fileUrl,
                  fileName: comment.attachment.fileName ?? "attachment",
                })
              }
            />
          ),
        )
      )}

      {isAdding ? (
        <CommentForm
          mode="create"
          isSubmitting={createMutation.isPending}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<PlusIcon size={14} animateOnHover={false} />}
          onClick={() => setIsAdding(true)}
          style={{ alignSelf: "flex-start" }}
        >
          Add new comment
        </Button>
      )}

      <DeleteCommentConfirmModal
        opened={pendingDeleteId !== null}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </Stack>
  );
};

export const CommentsSection = memo(CommentsSectionComponent);
