import { z } from "zod";

/**
 * Single source of truth for what a Todoist access token looks like — shared as-is
 * by the renderer login form (client-side validation) and the IPC boundary
 * (server-side validation), so the two never drift apart.
 */
export const accessTokenSchema = z
  .string()
  .trim()
  .min(32, "Access token is too short")
  .regex(/^\S+$/, "Access token must not contain whitespace");

export type AccessTokenParseFailure = { success: false; error: string };
export type AccessTokenParseSuccess = { success: true; data: AccessToken };

export class AccessToken {
  private constructor(readonly value: string) {}

  static safeParse(
    rawValue: string,
  ): AccessTokenParseSuccess | AccessTokenParseFailure {
    const result = accessTokenSchema.safeParse(rawValue);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Invalid access token",
      };
    }

    return { success: true, data: new AccessToken(result.data) };
  }
}
