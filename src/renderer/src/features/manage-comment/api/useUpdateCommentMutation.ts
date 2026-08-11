import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsListQueryKey } from "@/entities/comment";
import type { CommentDTO, CommentsListResult } from "@/main/comments";
import type { CommentFormAttachmentChange } from "../model/attachmentChange";
import { updateComment } from "./updateComment";

type UpdateCommentVariables = {
  commentId: string;
  content: string;
  attachmentChange: CommentFormAttachmentChange;
};

/** Optimistic preview of what the comment's attachment looks like right after
 * submit — a `"replace"` shows the new file with `fileUrl: null` ("still
 * uploading", same convention as `useCreateCommentMutation`), until the real
 * result swaps it in. */
const resolveOptimisticAttachment = (
  current: CommentDTO["attachment"],
  change: CommentFormAttachmentChange,
): CommentDTO["attachment"] => {
  if (change.type === "keep") return current;
  if (change.type === "remove") return null;
  return {
    resourceType: "file",
    fileName: change.file.name,
    fileType: change.file.type || null,
    fileUrl: null,
  };
};

/**
 * Editing a comment is optimistic: the card's content (and attachment) is
 * patched in place immediately, rolled back with an error notification if
 * the API call fails — same pattern as `useUpdateTaskMutation`.
 *
 * Todoist's update endpoint can only change `content`, never the attachment
 * (see `TodoistCommentGateway.save`) — whenever `attachmentChange` isn't
 * `"keep"`, the backend deletes the comment and recreates it, so the result
 * can carry a *different* `id` than `commentId`. That's fine here: the swap
 * below matches by the old `commentId` (closed over from the mutation
 * variables) and replaces the whole comment object, new id included.
 */
export const useUpdateCommentMutation = (taskId: string) => {
  const queryClient = useQueryClient();
  const queryKey = commentsListQueryKey(taskId);

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
      attachmentChange,
    }: UpdateCommentVariables) => {
      if (attachmentChange.type === "keep") {
        return updateComment(commentId, { content });
      }
      if (attachmentChange.type === "remove") {
        return updateComment(commentId, {
          content,
          attachment: { type: "remove" },
        });
      }
      const bytes = await attachmentChange.file.arrayBuffer();
      return updateComment(commentId, {
        content,
        attachment: {
          type: "replace",
          fileName: attachmentChange.file.name,
          bytes,
        },
      });
    },

    onMutate: async ({ commentId, content, attachmentChange }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommentsListResult>(queryKey);

      queryClient.setQueryData<CommentsListResult>(queryKey, (data) =>
        data?.ok
          ? {
              ...data,
              comments: data.comments.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      content,
                      attachment: resolveOptimisticAttachment(
                        comment.attachment,
                        attachmentChange,
                      ),
                    }
                  : comment,
              ),
            }
          : data,
      );

      return { previous };
    },

    onSuccess: (result, { commentId }, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't save comment",
          message: result.error.message,
        });
        return;
      }

      queryClient.setQueryData<CommentsListResult>(queryKey, (data) =>
        data?.ok
          ? {
              ...data,
              comments: data.comments.map((comment) =>
                comment.id === commentId ? result.comment : comment,
              ),
            }
          : data,
      );
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't save comment",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
