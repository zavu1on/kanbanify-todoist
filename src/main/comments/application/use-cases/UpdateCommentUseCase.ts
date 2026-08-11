import type { IAttachmentGateway } from "../../../attachments/application/ports/IAttachmentGateway";
import { Attachment } from "../../../attachments/domain/entities/Attachment";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { Comment, type CommentAttachment } from "../../domain/entities/Comment";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import { CommentMapper } from "../../domain/mappers/CommentMapper";
import type {
  UpdateCommentAttachmentChange,
  UpdateCommentInput,
} from "../dtos/UpdateCommentInput";
import type { ICommentGateway } from "../ports/ICommentGateway";

export class UpdateCommentUseCase
  implements UseCase<UpdateCommentInput, Comment>
{
  private readonly commentMapper = new CommentMapper();

  constructor(
    private readonly commentGateway: ICommentGateway,
    private readonly attachmentGateway: IAttachmentGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: UpdateCommentInput): Promise<Comment> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidCommentSessionError();

    const original = await this.commentGateway.getComment(
      accessToken.value,
      input.commentId,
    );
    // Content validation happens inside `Comment#update`.
    original.update(input.content);

    if (input.attachmentChange.type === "keep") {
      return this.commentGateway.save(accessToken.value, original);
    }

    return this.replaceComment(
      accessToken.value,
      original,
      input.attachmentChange,
    );
  }

  /** Todoist's update endpoint has no `attachment` field (see
   * `TodoistCommentGateway.save`) — changing what's attached means deleting
   * the old comment and creating a new one with the desired attachment.
   * The upload happens first, before anything is deleted, so a rejected
   * (too large / network) upload never destroys the original comment. */
  private async replaceComment(
    accessToken: string,
    original: Comment,
    change: Exclude<UpdateCommentAttachmentChange, { type: "keep" }>,
  ): Promise<Comment> {
    const attachment =
      change.type === "replace"
        ? await this.uploadAttachment(accessToken, change)
        : null;

    if (original.attachment?.fileUrl) {
      await this.attachmentGateway.delete(
        accessToken,
        original.attachment.fileUrl,
      );
    }
    await this.commentGateway.delete(accessToken, original.id);

    const replacement = Comment.create({
      taskId: original.taskId,
      content: original.content,
      attachment,
    });
    return this.commentGateway.create(accessToken, replacement);
  }

  private async uploadAttachment(
    accessToken: string,
    change: { fileName: string; bytes: Buffer },
  ): Promise<CommentAttachment> {
    // Throws AttachmentTooLargeError before any network call if the file
    // exceeds Todoist's Free-plan cap (see `attachments` module).
    const pending = Attachment.create({
      fileName: change.fileName,
      sizeBytes: change.bytes.byteLength,
    });
    const uploaded = await this.attachmentGateway.upload(
      accessToken,
      pending,
      change.bytes,
    );
    return this.commentMapper.fromUploadedAttachment(uploaded);
  }
}
