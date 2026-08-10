import type { CommentDTO } from "../dtos/CommentDTO";
import type { CommentsFailure } from "./CommentsFailure";

export type CreateCommentResult =
  | { ok: true; comment: CommentDTO }
  | CommentsFailure;
