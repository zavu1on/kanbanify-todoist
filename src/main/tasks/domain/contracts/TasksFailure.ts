export type TasksErrorType =
  | "auth_error"
  | "network_error"
  | "already_completed"
  | "invalid_title"
  | "unknown";

/** The `{ ok: false }` shape shared by every `tasks:*` IPC contract — extracted
 * once so `TasksListResult`/`UpdateTaskStatusResult` don't each redeclare it. */
export type TasksFailure = {
  ok: false;
  error: { type: TasksErrorType; message: string };
};
