import type { CommentAttachment } from "../entities/Comment";

/** The IPC-serializable shape of a `Comment` — see BACKEND_CODE_STYLE_GUIDE.md
 * "IPC-контракт и обработка ошибок": a domain entity never crosses IPC as-is,
 * only through its DTO. `postedAt` is an ISO string, not a `Date` — structured
 * clone would carry a `Date` fine, but the rest of the app's DTOs (`TaskDTO`)
 * already commit to plain strings on the wire, so this stays consistent. */
export type CommentDTO = {
  id: string;
  taskId: string;
  content: string;
  postedAt: string;
  attachment: CommentAttachment | null;
};
