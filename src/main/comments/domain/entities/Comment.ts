import { InvalidCommentContentError } from "../errors/InvalidCommentContentError";
import { CommentContent } from "../value-objects/CommentContent";

/** Display-only projection of Todoist's file attachment — this app never
 * uploads/downloads files (out of scope, see `docs/feat/comments/COMMENTS.md`),
 * so there's no invariant to enforce and no VO needed, just the wire shape. */
export type CommentAttachment = {
  resourceType: string;
  fileName: string | null;
  fileType: string | null;
  fileUrl: string | null;
};

export type CommentCreateDetails = { taskId: string; content: string };

export type CommentReconstituteSource = {
  id: string;
  taskId: string;
  content: string;
  postedAt: Date;
  attachment: CommentAttachment | null;
};

export class Comment {
  private _content: CommentContent;

  private constructor(
    readonly id: string,
    readonly taskId: string,
    content: CommentContent,
    readonly postedAt: Date,
    private readonly _attachment: CommentAttachment | null,
  ) {
    this._content = content;
  }

  get content(): string {
    return this._content.value;
  }

  /** Read-only — see `CommentAttachment`, no upload/download support yet. */
  get attachment(): CommentAttachment | null {
    return this._attachment;
  }

  /** Factory for a comment that doesn't exist in Todoist yet — `id` is empty
   * until `ICommentGateway.create` resolves with the real, API-assigned one.
   * Validates its content. */
  static create(details: CommentCreateDetails): Comment {
    return new Comment(
      "",
      details.taskId,
      Comment.parseContent(details.content),
      new Date(),
      null,
    );
  }

  /** Rebuilds a comment from already-trusted data (a mapped API response) —
   * skips content validation, unlike `create`. */
  static reconstitute(source: CommentReconstituteSource): Comment {
    return new Comment(
      source.id,
      source.taskId,
      CommentContent.of(source.content),
      source.postedAt,
      source.attachment,
    );
  }

  /** Mutates this comment's content in place, re-validating it. */
  update(content: string): void {
    this._content = Comment.parseContent(content);
  }

  private static parseContent(rawContent: string): CommentContent {
    const result = CommentContent.safeParse(rawContent);
    if (!result.success) throw new InvalidCommentContentError(result.error);
    return result.data;
  }
}
