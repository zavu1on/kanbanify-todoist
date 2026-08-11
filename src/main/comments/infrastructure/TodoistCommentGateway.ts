import { TodoistApi } from "@doist/todoist-sdk";
import type { ICommentGateway } from "../application/ports/ICommentGateway";
import type { Comment } from "../domain/entities/Comment";
import { CommentMapper } from "../domain/mappers/CommentMapper";
import { TodoistCommentsErrorClassifier } from "./TodoistCommentsErrorClassifier";

/** Todoist caps list pages at 200 (same as tasks, see SPECIFICATION.md "Задачи") —
 * `listComments` loops every page via `do...while` so callers always get the
 * complete list in one call (see COMMENTS.md). */
const PAGE_SIZE = 200;

export class TodoistCommentGateway implements ICommentGateway {
  private readonly commentMapper = new CommentMapper();
  private readonly errorClassifier = new TodoistCommentsErrorClassifier();

  async listComments(accessToken: string, taskId: string): Promise<Comment[]> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const all: Comment[] = [];
      let cursor: string | null = null;
      do {
        const { results, nextCursor } = await api.getComments({
          taskId,
          cursor,
          limit: PAGE_SIZE,
        });
        all.push(...results.map((comment) => this.toDomain(comment)));
        cursor = nextCursor;
      } while (cursor);
      return all;
    });
  }

  async getComment(accessToken: string, commentId: string): Promise<Comment> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const comment = await api.getComment(commentId);
      return this.toDomain(comment);
    });
  }

  async create(accessToken: string, comment: Comment): Promise<Comment> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const created = await api.addComment({
        taskId: comment.taskId,
        content: comment.content,
        attachment: this.toApiAttachment(comment.attachment),
      });
      return this.toDomain(created);
    });
  }

  /** Todoist's update endpoint only ever accepts `content` — it has no
   * `attachment` field, so it can never touch what's attached (which is
   * exactly why `UpdateCommentUseCase` deletes-and-recreates the comment
   * instead, whenever the attachment itself needs to change). */
  async save(accessToken: string, comment: Comment): Promise<Comment> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const updated = await api.updateComment(comment.id, {
        content: comment.content,
      });
      return this.toDomain(updated);
    });
  }

  private toApiAttachment(
    attachment: Comment["attachment"],
  ):
    | {
        fileUrl: string;
        fileName?: string;
        fileType?: string;
        resourceType?: string;
      }
    | undefined {
    if (!attachment?.fileUrl) return undefined;
    return {
      fileUrl: attachment.fileUrl,
      fileName: attachment.fileName ?? undefined,
      fileType: attachment.fileType ?? undefined,
      resourceType: attachment.resourceType,
    };
  }

  async delete(accessToken: string, commentId: string): Promise<void> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      await api.deleteComment(commentId);
    });
  }

  /** The SDK's transformed `Comment` already renames the raw `itemId` field to
   * `taskId` (see the `CommentSchema` pipe in `@doist/todoist-sdk`), so it
   * matches `CommentApiSource` without remapping fields by hand. */
  private toDomain(source: {
    id: string;
    taskId?: string;
    content: string;
    postedAt: Date;
    fileAttachment: {
      resourceType: string;
      fileName?: string | null;
      fileType?: string | null;
      fileUrl?: string | null;
    } | null;
  }): Comment {
    return this.commentMapper.toDomain({
      id: source.id,
      // Project comments are out of scope (see COMMENTS.md) — every comment
      // this app reads or writes always carries a `taskId`.
      taskId: source.taskId ?? "",
      content: source.content,
      postedAt: source.postedAt,
      fileAttachment: source.fileAttachment,
    });
  }
}
