import type { AttachmentsFailure } from "./AttachmentsFailure";

/** `saved: false` means the user canceled the native save dialog — a normal
 * outcome, not a failure. */
export type DownloadAttachmentResult =
  | { ok: true; saved: true; filePath: string }
  | { ok: true; saved: false }
  | AttachmentsFailure;
