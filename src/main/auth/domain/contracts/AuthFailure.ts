export type AuthErrorType = "invalid_token" | "network_error" | "unknown";

export const PLAINTEXT_TOKEN_STORAGE_WARNING =
  "OS-level encryption is unavailable on this system — your Todoist access token was stored without encryption.";

/** The `{ ok: false }` shape shared by every `auth:*` IPC contract — extracted
 * once so `LoginResult`/`LogoutResult` don't each redeclare it. */
export type AuthFailure = {
  ok: false;
  error: { type: AuthErrorType; message: string };
};
