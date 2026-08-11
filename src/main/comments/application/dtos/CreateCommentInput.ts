export type CreateCommentAttachmentInput = { fileName: string; bytes: Buffer };

export class CreateCommentInput {
  constructor(
    readonly taskId: string,
    readonly content: string,
    readonly attachment: CreateCommentAttachmentInput | null = null,
  ) {}
}
