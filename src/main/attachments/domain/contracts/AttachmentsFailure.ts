export type AttachmentsErrorType = "auth_error" | "network_error" | "unknown";

/** The `{ ok: false }` shape shared by every `attachments:*` IPC contract —
 * extracted once so future contracts don't each redeclare it (see
 * BACKEND_CODE_STYLE_GUIDE.md "IPC-контракт"). */
export type AttachmentsFailure = {
  ok: false;
  error: { type: AttachmentsErrorType; message: string };
};
