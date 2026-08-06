export type ProjectsErrorType =
  | "auth_error"
  | "network_error"
  | "not_found"
  | "invalid_name"
  | "inbox_protected"
  | "unknown";

/** The `{ ok: false }` shape shared by every `projects:*` IPC contract — extracted
 * once so future project contracts don't each redeclare it (see `TasksFailure`). */
export type ProjectsFailure = {
  ok: false;
  error: { type: ProjectsErrorType; message: string };
};
