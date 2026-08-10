import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsListQueryKey } from "@/entities/comment";
import type { CommentsListResult } from "@/main/comments";
import { updateComment } from "./updateComment";

type UpdateCommentVariables = { commentId: string; content: string };

/**
 * Editing a comment is optimistic: the card's content is patched in place
 * immediately, rolled back with an error notification if the API call
 * fails — same pattern as `useUpdateTaskMutation`.
 */
export const useUpdateCommentMutation = (taskId: string) => {
  const queryClient = useQueryClient();
  const queryKey = commentsListQueryKey(taskId);

  return useMutation({
    mutationFn: ({ commentId, content }: UpdateCommentVariables) =>
      updateComment(commentId, { content }),

    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommentsListResult>(queryKey);

      queryClient.setQueryData<CommentsListResult>(queryKey, (data) =>
        data?.ok
          ? {
              ...data,
              comments: data.comments.map((comment) =>
                comment.id === commentId ? { ...comment, content } : comment,
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
