import type { Attachment } from "../../domain/entities/Attachment";

export interface IAttachmentGateway {
  /** Uploads file bytes to Todoist's file storage. This alone does not attach
   * the file to any comment — see COMMENTS.md upload flow, `addComment`/
   * `updateComment` with `attachment` is the step that does.
   * @throws {import("../../domain/errors/AttachmentsError").AttachmentsError} */
  upload(
    accessToken: string,
    attachment: Attachment,
    bytes: Buffer,
  ): Promise<Attachment>;

  /** Deletes an uploaded file outright. Does not detach it from a comment that
   * already references it — callers must update that comment separately.
   * @throws {import("../../domain/errors/AttachmentsError").AttachmentsError} */
  delete(accessToken: string, fileUrl: string): Promise<void>;

  /** Downloads the raw bytes of an uploaded file.
   * @throws {import("../../domain/errors/AttachmentsError").AttachmentsError} */
  download(accessToken: string, fileUrl: string): Promise<Buffer>;
}
