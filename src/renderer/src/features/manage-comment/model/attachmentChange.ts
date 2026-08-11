/** What `CommentForm` decided happened to the attachment slot between mount
 * and submit — `keep` covers both "nothing was ever attached" and "an
 * existing attachment was left untouched", since neither needs a call. */
export type CommentFormAttachmentChange =
  | { type: "keep" }
  | { type: "remove" }
  | { type: "replace"; file: File };
