import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsListQueryKey } from "@/entities/comment";
import type { CommentDTO, CommentsListResult } from "@/main/comments";
import { createComment } from "./createComment";

type CreateCommentVariables = { content: string; file?: File };

/**
 * Adding a comment is optimistic: a placeholder card (temporary id) appears
 * in the list immediately and is swapped for the real one once Todoist
 * assigns it an id, rolled back with an error notification on failure —
 * same pattern as `useCreateTaskMutation`. A picked file is only read into
 * bytes and uploaded here, at submit time (see `CommentForm`) — the
 * placeholder shows it with `fileUrl: null`, which doubles as "still
 * uploading" for `CommentCard`'s download button. Comments only ever show up
 * in this one task's detail modal, so there's no other screen's cache to
 * invalidate on success (unlike task mutations).
 */
export const useCreateCommentMutation = (taskId: string) => {
  const queryClient = useQueryClient();
  const queryKey = commentsListQueryKey(taskId);

  return useMutation({
    mutationFn: async ({ content, file }: CreateCommentVariables) => {
      const attachment = file
        ? { fileName: file.name, bytes: await file.arrayBuffer() }
        : undefined;
      return createComment({ taskId, content, attachment });
    },

    onMutate: async ({ content, file }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommentsListResult>(queryKey);

      const optimisticComment: CommentDTO = {
        id: `temp-${crypto.randomUUID()}`,
        taskId,
        content,
        postedAt: new Date().toISOString(),
        attachment: file
          ? {
              resourceType: "file",
              fileName: file.name,
              fileType: file.type || null,
              fileUrl: null,
            }
          : null,
      };

      queryClient.setQueryData<CommentsListResult>(queryKey, (data) =>
        data?.ok
          ? { ...data, comments: [...data.comments, optimisticComment] }
          : data,
      );

      return { previous, optimisticId: optimisticComment.id };
    },

    // The API result is a discriminated union, not a throw (see BACKEND_CODE_STYLE_GUIDE.md
    // "IPC-контракт"), so a failed create surfaces here as `result.ok === false`, not `onError`.
    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't add comment",
          message: result.error.message,
        });
        return;
      }

      queryClient.setQueryData<CommentsListResult>(queryKey, (data) =>
        data?.ok
          ? {
              ...data,
              comments: data.comments.map((comment) =>
                comment.id === context?.optimisticId ? result.comment : comment,
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
        title: "Couldn't add comment",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
