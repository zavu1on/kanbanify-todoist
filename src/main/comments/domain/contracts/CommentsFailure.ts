export type CommentsErrorType =
  | "auth_error"
  | "network_error"
  | "invalid_content"
  | "file_too_large"
  | "unknown";

/** The `{ ok: false }` shape shared by every `comments:*` IPC contract —
 * extracted once so `CommentsListResult`/`CreateCommentResult`/... don't each
 * redeclare it (see BACKEND_CODE_STYLE_GUIDE.md "IPC-контракт"). */
export type CommentsFailure = {
  ok: false;
  error: { type: CommentsErrorType; message: string };
};
