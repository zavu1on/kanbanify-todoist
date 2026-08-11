import type {
  DownloadAttachmentRequest,
  DownloadAttachmentResult,
} from "@/main/attachments";

export const downloadAttachment = (
  request: DownloadAttachmentRequest,
): Promise<DownloadAttachmentResult> =>
  window.api.attachments.download(request);
