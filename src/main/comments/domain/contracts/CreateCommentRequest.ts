/** `bytes` crosses IPC as `ArrayBuffer` — `File`/`Blob` from the renderer's
 * `<input type="file">` cannot be structured-cloned to the main process, so
 * the renderer reads the file into an `ArrayBuffer` first. */
export type CreateCommentAttachmentRequest = {
  fileName: string;
  bytes: ArrayBuffer;
};

/** The IPC-serializable input for `comments:create` — shared by `preload`
 * (typing the invoke call) and the renderer (building the payload), so
 * neither side restates these fields on its own. */
export type CreateCommentRequest = {
  taskId: string;
  content: string;
  /** Absent when the comment has no file attached. */
  attachment?: CreateCommentAttachmentRequest;
};
