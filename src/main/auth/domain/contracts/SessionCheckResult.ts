import type { SessionCheckOutput } from "../../application/dtos/SessionCheckOutput";
import type { AuthFailure } from "./AuthFailure";

/** The IPC-serializable shape of a startup session check (stored token, if any,
 * revalidated against Todoist). Distinct from `LoginResult`: "no token stored"
 * is a valid outcome here, not an error. */
export type SessionCheckResult =
  | SessionCheckOutput
  | { status: "error"; error: AuthFailure["error"] };
