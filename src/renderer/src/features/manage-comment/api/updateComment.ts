import type {
  UpdateCommentRequest,
  UpdateCommentResult,
} from "@/main/comments";

export const updateComment = (
  commentId: string,
  input: UpdateCommentRequest,
): Promise<UpdateCommentResult> => window.api.comments.update(commentId, input);
