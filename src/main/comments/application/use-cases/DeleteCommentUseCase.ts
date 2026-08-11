import type { IAttachmentGateway } from "../../../attachments/application/ports/IAttachmentGateway";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import type { ICommentGateway } from "../ports/ICommentGateway";

export class DeleteCommentUseCase implements UseCase<string, void> {
  constructor(
    private readonly commentGateway: ICommentGateway,
    private readonly attachmentGateway: IAttachmentGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(commentId: string): Promise<void> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidCommentSessionError();

    // Todoist doesn't cascade-delete a comment's attachment (see
    // `IAttachmentGateway.delete`) — same reason `UpdateCommentUseCase`
    // cleans it up explicitly before deleting/recreating the comment.
    const comment = await this.commentGateway.getComment(
      accessToken.value,
      commentId,
    );
    if (comment.attachment?.fileUrl) {
      await this.attachmentGateway.delete(
        accessToken.value,
        comment.attachment.fileUrl,
      );
    }
    await this.commentGateway.delete(accessToken.value, commentId);
  }
}
