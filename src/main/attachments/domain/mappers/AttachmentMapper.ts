import { Attachment } from "../entities/Attachment";

/** The subset of Todoist's upload-response shape this app reads — kept structural
 * (not the SDK's own type) so this mapper stays free of an SDK import. */
export type AttachmentApiSource = {
  resourceType: string;
  fileName?: string | null;
  fileType?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
};

/**
 * Maps a raw Todoist upload response into the domain `Attachment`. Todoist's
 * response can omit `fileName`/`fileSize` — `fallback` (the not-yet-uploaded
 * `Attachment` the gateway sent) fills those in when it does.
 */
export class AttachmentMapper {
  toDomain(source: AttachmentApiSource, fallback: Attachment): Attachment {
    return Attachment.reconstitute({
      fileName: source.fileName ?? fallback.fileName,
      sizeBytes: source.fileSize ?? fallback.sizeBytes,
      resourceType: source.resourceType,
      fileType: source.fileType ?? null,
      fileUrl: source.fileUrl ?? null,
    });
  }
}
