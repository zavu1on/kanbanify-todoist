import type { CommentDTO } from "../dtos/CommentDTO";
import type { CommentsFailure } from "./CommentsFailure";

/** The IPC-serializable shape of a `comments:list` call — every comment for
 * one task in a single response (see COMMENTS.md: fetched all at once via a
 * `do...while` cursor loop inside `TodoistCommentGateway`, not paginated on
 * the wire like `tasks:list`). */
export type CommentsListResult =
  | { ok: true; comments: CommentDTO[] }
  | CommentsFailure;
