import type {
  CreateCommentRequest,
  CreateCommentResult,
} from "@/main/comments";

export const createComment = (
  input: CreateCommentRequest,
): Promise<CreateCommentResult> => window.api.comments.create(input);
