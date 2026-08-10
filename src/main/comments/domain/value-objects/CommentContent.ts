import { z } from "zod";

/** Todoist doesn't publish a hard content-length cap; 15000 mirrors the app's
 * own description field bound, generous enough not to reject a real comment. */
export const commentContentSchema = z
  .string()
  .trim()
  .min(1, "Comment cannot be empty")
  .max(15000, "Comment must be 15000 characters or fewer");

export type CommentContentParseFailure = { success: false; error: string };
export type CommentContentParseSuccess = {
  success: true;
  data: CommentContent;
};

export class CommentContent {
  private constructor(readonly value: string) {}

  static safeParse(
    rawValue: string,
  ): CommentContentParseSuccess | CommentContentParseFailure {
    const result = commentContentSchema.safeParse(rawValue);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid comment content",
      };
    }

    return { success: true, data: new CommentContent(result.data) };
  }

  /** Trusted constructor for already-valid data (a mapped API response) —
   * skips validation, unlike `safeParse`. */
  static of(value: string): CommentContent {
    return new CommentContent(value);
  }
}
