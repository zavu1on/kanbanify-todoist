import type { AuthenticatedUser } from "../entities/AuthenticatedUser";
import type { AuthErrorType } from "./LoginResult";

/** The IPC-serializable shape of a startup session check (stored token, if any,
 * revalidated against Todoist). Distinct from `LoginResult`: "no token stored"
 * is a valid outcome here, not an error. */
export type SessionCheckResult =
  | { status: "authenticated"; user: AuthenticatedUser }
  | { status: "no_token" }
  | { status: "error"; error: { type: AuthErrorType; message: string } };
