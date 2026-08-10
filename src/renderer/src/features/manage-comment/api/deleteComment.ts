import type { DeleteCommentResult } from "@/main/comments";

export const deleteComment = (
  commentId: string,
): Promise<DeleteCommentResult> => window.api.comments.delete(commentId);
