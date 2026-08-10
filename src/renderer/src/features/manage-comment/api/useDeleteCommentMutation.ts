import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsListQueryKey } from "@/entities/comment";
import type { CommentsListResult } from "@/main/comments";
import { deleteComment } from "./deleteComment";

type DeleteCommentVariables = { commentId: string };

/**
 * Deleting a comment is optimistic — it's removed from the cache immediately
 * and put back with an error notification if the API call fails, same
 * pattern as `useDeleteTaskMutation`.
 */
export const useDeleteCommentMutation = (taskId: string) => {
  const queryClient = useQueryClient();
  const queryKey = commentsListQueryKey(taskId);

  return useMutation({
    mutationFn: ({ commentId }: DeleteCommentVariables) =>
      deleteComment(commentId),

    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommentsListResult>(queryKey);

      queryClient.setQueryData<CommentsListResult>(queryKey, (data) =>
        data?.ok
          ? {
              ...data,
              comments: data.comments.filter(
                (comment) => comment.id !== commentId,
              ),
            }
          : data,
      );

      return { previous };
    },

    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't delete comment",
          message: result.error.message,
        });
      }
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't delete comment",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
