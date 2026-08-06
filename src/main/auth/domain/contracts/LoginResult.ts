import type { AuthenticatedUserDTO } from "../dtos/AuthenticatedUserDTO";
import type { AuthFailure } from "./AuthFailure";

/** The IPC-serializable shape of a login attempt. Owned by the domain layer so
 * `preload` and the renderer consume the exact same contract main returns. */
export type LoginResult =
  | { ok: true; user: AuthenticatedUserDTO; tokenStorageWarning?: string }
  | AuthFailure;
