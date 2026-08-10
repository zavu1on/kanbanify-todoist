import type { CommentDTO } from "../dtos/CommentDTO";
import { Comment, type CommentAttachment } from "../entities/Comment";

/** The subset of the Todoist API comment shape this app reads — kept structural
 * (not the SDK's own type) so this mapper stays free of an SDK import. */
export type CommentApiSource = {
  id: string;
  taskId: string;
  content: string;
  postedAt: Date;
  fileAttachment: {
    resourceType: string;
    fileName?: string | null;
    fileType?: string | null;
    fileUrl?: string | null;
  } | null;
};

/**
 * Maps a raw Todoist API comment into the domain `Comment`.
 */
export class CommentMapper {
  toDomain(source: CommentApiSource): Comment {
    return Comment.reconstitute({
      id: source.id,
      taskId: source.taskId,
      content: source.content,
      postedAt: source.postedAt,
      attachment: this.toAttachment(source.fileAttachment),
    });
  }

  toDTO(comment: Comment): CommentDTO {
    return {
      id: comment.id,
      taskId: comment.taskId,
      content: comment.content,
      postedAt: comment.postedAt.toISOString(),
      attachment: comment.attachment,
    };
  }

  private toAttachment(
    source: CommentApiSource["fileAttachment"],
  ): CommentAttachment | null {
    if (!source) return null;
    return {
      resourceType: source.resourceType,
      fileName: source.fileName ?? null,
      fileType: source.fileType ?? null,
      fileUrl: source.fileUrl ?? null,
    };
  }
}
