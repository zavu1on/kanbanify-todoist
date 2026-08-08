export type LabelsErrorType =
  | "auth_error"
  | "network_error"
  | "invalid_name"
  | "unknown";

/** The `{ ok: false }` shape shared by every `labels:*` IPC contract — extracted
 * once so future label contracts don't each redeclare it (see `TasksFailure`). */
export type LabelsFailure = {
  ok: false;
  error: { type: LabelsErrorType; message: string };
};
