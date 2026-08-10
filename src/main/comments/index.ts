/**
 * Public API of the `comments` module — the only surface other processes see.
 */

export type { CommentsErrorType } from "./domain/contracts/CommentsFailure";
export type { CommentsListResult } from "./domain/contracts/CommentsListResult";
export type { CreateCommentRequest } from "./domain/contracts/CreateCommentRequest";
export type { CreateCommentResult } from "./domain/contracts/CreateCommentResult";
export type { DeleteCommentResult } from "./domain/contracts/DeleteCommentResult";
export type { UpdateCommentRequest } from "./domain/contracts/UpdateCommentRequest";
export type { UpdateCommentResult } from "./domain/contracts/UpdateCommentResult";
export type { CommentAttachment } from "./domain/entities/Comment";
export type { CommentDTO } from "./domain/dtos/CommentDTO";
