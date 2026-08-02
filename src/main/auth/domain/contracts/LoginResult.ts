import type { AuthenticatedUser } from "../entities/AuthenticatedUser";

export type AuthErrorType = "invalid_token" | "network_error" | "unknown";

export const PLAINTEXT_TOKEN_STORAGE_WARNING =
  "OS-level encryption is unavailable on this system — your Todoist access token was stored without encryption.";

/** The IPC-serializable shape of a login attempt. Owned by the domain layer so
 * `preload` and the renderer consume the exact same contract main returns. */
export type LoginResult =
  | { ok: true; user: AuthenticatedUser; tokenStorageWarning?: string }
  | { ok: false; error: { type: AuthErrorType; message: string } };
