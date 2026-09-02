import { z } from "zod";

export const filterTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(120, "Title must be 120 characters or fewer");

export type FilterTitleParseFailure = { success: false; error: string };
export type FilterTitleParseSuccess = { success: true; data: FilterTitle };

export class FilterTitle {
  private constructor(readonly value: string) {}

  static safeParse(
    rawValue: string,
  ): FilterTitleParseSuccess | FilterTitleParseFailure {
    const result = filterTitleSchema.safeParse(rawValue);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid filter title",
      };
    }

    return { success: true, data: new FilterTitle(result.data) };
  }

  /** Trusted constructor for already-valid data (a row read from the store) —
   * skips validation, unlike `safeParse`. */
  static of(value: string): FilterTitle {
    return new FilterTitle(value);
  }
}
