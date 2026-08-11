/** `keep` leaves the comment's current attachment untouched — the default,
 * used whenever the edit form's attachment state didn't change. */
export type UpdateCommentAttachmentChange =
  | { type: "keep" }
  | { type: "remove" }
  | { type: "replace"; fileName: string; bytes: Buffer };

export class UpdateCommentInput {
  constructor(
    readonly commentId: string,
    readonly content: string,
    readonly attachmentChange: UpdateCommentAttachmentChange = { type: "keep" },
  ) {}
}
