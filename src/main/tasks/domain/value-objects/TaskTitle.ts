import { z } from "zod";

/** Todoist doesn't publish a hard content-length cap; 500 is a generous bound
 * that keeps the field validated without guessing at an undocumented limit. */
export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(500, "Title must be 500 characters or fewer");

export type TaskTitleParseFailure = { success: false; error: string };
export type TaskTitleParseSuccess = { success: true; data: TaskTitle };

export class TaskTitle {
  private constructor(readonly value: string) {}

  static safeParse(
    rawValue: string,
  ): TaskTitleParseSuccess | TaskTitleParseFailure {
    const result = taskTitleSchema.safeParse(rawValue);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid task title",
      };
    }

    return { success: true, data: new TaskTitle(result.data) };
  }

  /** Trusted constructor for already-valid data (a mapped API response) —
   * skips validation, unlike `safeParse`. */
  static of(value: string): TaskTitle {
    return new TaskTitle(value);
  }
}
