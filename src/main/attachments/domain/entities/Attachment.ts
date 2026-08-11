import { AttachmentTooLargeError } from "../errors/AttachmentTooLargeError";
import { AttachmentSize } from "../value-objects/AttachmentSize";

export type AttachmentCreateDetails = { fileName: string; sizeBytes: number };
export type AttachmentReconstituteSource = {
  fileName: string;
  sizeBytes: number;
  resourceType: string | null;
  fileType: string | null;
  fileUrl: string | null;
};

export class Attachment {
  private constructor(
    readonly fileName: string,
    private readonly _size: AttachmentSize,
    readonly resourceType: string | null,
    readonly fileType: string | null,
    readonly fileUrl: string | null,
  ) {}

  get sizeBytes(): number {
    return this._size.bytes;
  }

  /** Factory for a file picked locally, not uploaded to Todoist yet — validates
   * the Free-plan size cap so an oversized file never reaches the network.
   * `resourceType`/`fileType`/`fileUrl` are unknown until `IAttachmentGateway.upload`
   * resolves with Todoist's response. */
  static create(details: AttachmentCreateDetails): Attachment {
    return new Attachment(
      details.fileName,
      Attachment.parseSize(details.sizeBytes),
      null,
      null,
      null,
    );
  }

  /** Rebuilds an attachment from an already-trusted source (Todoist's upload
   * response) — does not re-validate size, unlike `create`. */
  static reconstitute(source: AttachmentReconstituteSource): Attachment {
    return new Attachment(
      source.fileName,
      AttachmentSize.of(source.sizeBytes),
      source.resourceType,
      source.fileType,
      source.fileUrl,
    );
  }

  private static parseSize(rawBytes: number): AttachmentSize {
    const result = AttachmentSize.safeParse(rawBytes);
    if (!result.success) throw new AttachmentTooLargeError(result.error);
    return result.data;
  }
}
