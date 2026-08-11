import { TodoistApi, TodoistRequestError } from "@doist/todoist-sdk";
import type { IAttachmentGateway } from "../application/ports/IAttachmentGateway";
import type { Attachment } from "../domain/entities/Attachment";
import { AttachmentMapper } from "../domain/mappers/AttachmentMapper";
import { nodeCustomFetch } from "./nodeCustomFetch";
import { TodoistAttachmentsErrorClassifier } from "./TodoistAttachmentsErrorClassifier";

/** Every method here needs `nodeCustomFetch` (see that file for why) —
 * without it, uploads silently send `"[object FormData]"` as the body
 * instead of the actual file. */
export class TodoistAttachmentGateway implements IAttachmentGateway {
  private readonly attachmentMapper = new AttachmentMapper();
  private readonly errorClassifier = new TodoistAttachmentsErrorClassifier();

  async upload(
    accessToken: string,
    attachment: Attachment,
    bytes: Buffer,
  ): Promise<Attachment> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken, { customFetch: nodeCustomFetch });
      // Wrapped as a `Blob`, not passed as a raw `Buffer` — a `Buffer` sends
      // the SDK down its Node path, which builds the body via the `form-data`
      // npm package (a legacy Node `Readable`). Even the global `fetch`
      // doesn't know how to serialize that stream as a request body — it
      // silently stringifies it instead. `Blob` makes the SDK build the body
      // with the standard `FormData` API, which `fetch` handles correctly.
      const uploaded = await api.uploadFile({
        file: new Blob([Uint8Array.from(bytes)]),
        fileName: attachment.fileName,
      });
      return this.attachmentMapper.toDomain(uploaded, attachment);
    });
  }

  async delete(accessToken: string, fileUrl: string): Promise<void> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken, { customFetch: nodeCustomFetch });
      try {
        await api.deleteUpload({ fileUrl });
      } catch (error) {
        // Deleting is idempotent: a file that's already gone means the goal
        // (no such file on Todoist) is already met. Without this, editing a
        // comment whose attachment Todoist has already GC'd — or a retry
        // after a prior delete succeeded but a later step in the same
        // replace-comment flow failed — would 404 forever with no recovery.
        if (this.isFileAlreadyDeleted(error)) return;
        throw error;
      }
    });
  }

  private isFileAlreadyDeleted(error: unknown): boolean {
    if (!(error instanceof TodoistRequestError)) return false;
    if (error.httpStatusCode !== 404) return false;
    const data = error.responseData as { error_tag?: string } | undefined;
    return data?.error_tag === "FILE_NOT_FOUND";
  }

  async download(accessToken: string, fileUrl: string): Promise<Buffer> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken, { customFetch: nodeCustomFetch });
      const response = await api.viewAttachment(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    });
  }
}
