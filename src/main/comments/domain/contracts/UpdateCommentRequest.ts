/** See `CreateCommentAttachmentRequest` for why `bytes` is an `ArrayBuffer`. */
export type UpdateCommentAttachmentRequest =
  | { type: "remove" }
  | { type: "replace"; fileName: string; bytes: ArrayBuffer };

/** The IPC-serializable input for `comments:update`. `attachment` absent means
 * "keep whatever is currently attached" — a plain content edit doesn't touch it. */
export type UpdateCommentRequest = {
  content: string;
  attachment?: UpdateCommentAttachmentRequest;
};
