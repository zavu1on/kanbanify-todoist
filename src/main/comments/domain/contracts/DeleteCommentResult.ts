import type { CommentsFailure } from "./CommentsFailure";

export type DeleteCommentResult = { ok: true } | CommentsFailure;
