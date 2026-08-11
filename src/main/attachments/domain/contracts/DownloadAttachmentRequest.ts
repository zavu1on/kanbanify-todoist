/** The IPC-serializable input for `attachments:download` — `fileName` seeds
 * the native save dialog's default file name. */
export type DownloadAttachmentRequest = {
  fileUrl: string;
  fileName: string;
};
