import type { AuthErrorType } from "./LoginResult";

/** The IPC-serializable shape of a logout attempt. */
export type LogoutResult =
  | { ok: true }
  | { ok: false; error: { type: AuthErrorType; message: string } };
