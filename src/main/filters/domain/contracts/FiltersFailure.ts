export type FiltersErrorType =
  | "auth_error"
  | "network_error"
  | "not_found"
  | "invalid_title"
  | "unknown";

/** The `{ ok: false }` shape shared by every `filters:*` IPC contract — extracted
 * once so future filter contracts don't each redeclare it (see `ProjectsFailure`). */
export type FiltersFailure = {
  ok: false;
  error: { type: FiltersErrorType; message: string };
};
