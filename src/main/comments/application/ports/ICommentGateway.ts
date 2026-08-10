import type { Comment } from "../../domain/entities/Comment";

export interface ICommentGateway {
  /** Fetches every comment for a task, looping through all cursor pages
   * internally (see COMMENTS.md: fetched all at once via a `do...while` loop,
   * not exposed as a "Load more" list like `ITaskGateway.listTasks`).
   * @throws {import("../../domain/errors/CommentsError").CommentsError} */
  listComments(accessToken: string, taskId: string): Promise<Comment[]>;

  /** @throws {import("../../domain/errors/CommentsError").CommentsError} */
  getComment(accessToken: string, commentId: string): Promise<Comment>;

  /** Creates a brand-new comment via Todoist's add endpoint — `comment.id` is
   * empty (see `Comment.create`); the returned comment carries the API-assigned id.
   * @throws {import("../../domain/errors/CommentsError").CommentsError} */
  create(accessToken: string, comment: Comment): Promise<Comment>;

  /** Persists this comment's content via Todoist's dedicated update endpoint.
   * @throws {import("../../domain/errors/CommentsError").CommentsError} */
  save(accessToken: string, comment: Comment): Promise<Comment>;

  /** Deletes a comment outright via Todoist's dedicated delete endpoint.
   * @throws {import("../../domain/errors/CommentsError").CommentsError} */
  delete(accessToken: string, commentId: string): Promise<void>;
}
