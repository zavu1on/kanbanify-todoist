import type { CommentDTO } from "../dtos/CommentDTO";
import type { CommentsFailure } from "./CommentsFailure";

export type UpdateCommentResult =
  | { ok: true; comment: CommentDTO }
  | CommentsFailure;
