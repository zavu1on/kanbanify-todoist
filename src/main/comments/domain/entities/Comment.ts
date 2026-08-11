import { InvalidCommentContentError } from "../errors/InvalidCommentContentError";
import { CommentContent } from "../value-objects/CommentContent";

/** The shape of Todoist's file attachment as stored on a comment — a comment
 * carries at most one (Todoist's `fileAttachment` is not an array). Building
 * one from an upload happens in `CommentMapper.fromUploadedAttachment`. */
export type CommentAttachment = {
  resourceType: string;
  fileName: string | null;
  fileType: string | null;
  fileUrl: string | null;
};

export type CommentCreateDetails = {
  taskId: string;
  content: string;
  attachment?: CommentAttachment | null;
};

export type CommentReconstituteSource = {
  id: string;
  taskId: string;
  content: string;
  postedAt: Date;
  attachment: CommentAttachment | null;
};

export class Comment {
  private _content: CommentContent;
  private _attachment: CommentAttachment | null;

  private constructor(
    readonly id: string,
    readonly taskId: string,
    content: CommentContent,
    readonly postedAt: Date,
    attachment: CommentAttachment | null,
  ) {
    this._content = content;
    this._attachment = attachment;
  }

  get content(): string {
    return this._content.value;
  }

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
      details.attachment ?? null,
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

  /** Mutates this comment's attachment in place — used when a file is added
   * to, replaced on, or removed from an existing comment during edit. */
  replaceAttachment(attachment: CommentAttachment | null): void {
    this._attachment = attachment;
  }

  private static parseContent(rawContent: string): CommentContent {
    const result = CommentContent.safeParse(rawContent);
    if (!result.success) throw new InvalidCommentContentError(result.error);
    return result.data;
  }
}
