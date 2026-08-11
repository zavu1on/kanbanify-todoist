/**
 * Public API of the `attachments` module — the only surface other processes see.
 */

export type { AttachmentsErrorType } from "./domain/contracts/AttachmentsFailure";
export type { DownloadAttachmentRequest } from "./domain/contracts/DownloadAttachmentRequest";
export type { DownloadAttachmentResult } from "./domain/contracts/DownloadAttachmentResult";
export { MAX_ATTACHMENT_SIZE_BYTES } from "./domain/value-objects/AttachmentSize";
