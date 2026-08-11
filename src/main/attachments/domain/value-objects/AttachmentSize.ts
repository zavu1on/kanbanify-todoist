import { z } from "zod";

/** Todoist has no API to query this — it's a static per-plan cap: Free is 5 MB,
 * Pro/Business is 100 MB (https://www.todoist.com/help/articles/usage-limits-in-todoist).
 * This app only ever runs against the Free plan (see CLAUDE.md "Ограничения тарифа"),
 * so the lower cap is the only one that applies. */
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const attachmentSizeSchema = z
  .number()
  .int()
  .positive()
  .max(
    MAX_ATTACHMENT_SIZE_BYTES,
    `File must be ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB or smaller`,
  );

export type AttachmentSizeParseFailure = { success: false; error: string };
export type AttachmentSizeParseSuccess = {
  success: true;
  data: AttachmentSize;
};

export class AttachmentSize {
  private constructor(readonly bytes: number) {}

  static safeParse(
    rawBytes: number,
  ): AttachmentSizeParseSuccess | AttachmentSizeParseFailure {
    const result = attachmentSizeSchema.safeParse(rawBytes);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid file size",
      };
    }

    return { success: true, data: new AttachmentSize(result.data) };
  }

  /** Trusted constructor for an already-uploaded file's size, read back from
   * Todoist — skips validation, unlike `safeParse`. */
  static of(bytes: number): AttachmentSize {
    return new AttachmentSize(bytes);
  }
}
