import { z } from "zod";

/** Matches the 120-character cap shown by Todoist's own "Add project" form
 * (the name field's live counter) — shared with the renderer form so both
 * sides reject the same input. */
export const projectNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name must be 120 characters or fewer");

export type ProjectNameParseFailure = { success: false; error: string };
export type ProjectNameParseSuccess = { success: true; data: ProjectName };

export class ProjectName {
  private constructor(readonly value: string) {}

  static safeParse(
    rawValue: string,
  ): ProjectNameParseSuccess | ProjectNameParseFailure {
    const result = projectNameSchema.safeParse(rawValue);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid project name",
      };
    }

    return { success: true, data: new ProjectName(result.data) };
  }
}
