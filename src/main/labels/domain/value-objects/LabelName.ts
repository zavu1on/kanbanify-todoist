import { z } from "zod";

/** Matches Todoist's own label-name cap (128 characters, checked server-side) —
 * shared with the renderer form so both sides reject the same input. */
export const labelNameSchema = z
  .string()
  .trim()
  .min(1, "Label name is required")
  .max(128, "Label name must be 128 characters or fewer");

export type LabelNameParseFailure = { success: false; error: string };
export type LabelNameParseSuccess = { success: true; data: LabelName };

export class LabelName {
  private constructor(readonly value: string) {}

  static safeParse(
    rawValue: string,
  ): LabelNameParseSuccess | LabelNameParseFailure {
    const result = labelNameSchema.safeParse(rawValue);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid label name",
      };
    }

    return { success: true, data: new LabelName(result.data) };
  }

  /** Trusted constructor for already-valid data (a mapped API response) —
   * skips validation, unlike `safeParse`. */
  static of(value: string): LabelName {
    return new LabelName(value);
  }
}
