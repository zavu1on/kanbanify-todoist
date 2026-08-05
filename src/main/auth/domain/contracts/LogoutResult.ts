import type { AuthFailure } from "./AuthFailure";

/** The IPC-serializable shape of a logout attempt. */
export type LogoutResult = { ok: true } | AuthFailure;
