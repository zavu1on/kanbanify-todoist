import type { CommentsListResult } from "@/main/comments";

export const listComments = (taskId: string): Promise<CommentsListResult> =>
  window.api.comments.list(taskId);
