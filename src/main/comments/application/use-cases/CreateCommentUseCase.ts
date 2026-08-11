import type { IAttachmentGateway } from "../../../attachments/application/ports/IAttachmentGateway";
import { Attachment } from "../../../attachments/domain/entities/Attachment";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { Comment, type CommentAttachment } from "../../domain/entities/Comment";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import { CommentMapper } from "../../domain/mappers/CommentMapper";
import type {
  CreateCommentAttachmentInput,
  CreateCommentInput,
} from "../dtos/CreateCommentInput";
import type { ICommentGateway } from "../ports/ICommentGateway";

export class CreateCommentUseCase
  implements UseCase<CreateCommentInput, Comment>
{
  private readonly commentMapper = new CommentMapper();

  constructor(
    private readonly commentGateway: ICommentGateway,
    private readonly attachmentGateway: IAttachmentGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidCommentSessionError();

    const attachment = input.attachment
      ? await this.uploadAttachment(accessToken.value, input.attachment)
      : null;

    // Validation (content emptiness) happens inside `Comment.create` — it
    // throws `InvalidCommentContentError` before any port call is made.
    const comment = Comment.create({
      taskId: input.taskId,
      content: input.content,
      attachment,
    });

    return this.commentGateway.create(accessToken.value, comment);
  }

  private async uploadAttachment(
    accessToken: string,
    input: CreateCommentAttachmentInput,
  ): Promise<CommentAttachment> {
    // Throws AttachmentTooLargeError before any network call if the file
    // exceeds Todoist's Free-plan cap (see `attachments` module).
    const pending = Attachment.create({
      fileName: input.fileName,
      sizeBytes: input.bytes.byteLength,
    });
    const uploaded = await this.attachmentGateway.upload(
      accessToken,
      pending,
      input.bytes,
    );
    return this.commentMapper.fromUploadedAttachment(uploaded);
  }
}
