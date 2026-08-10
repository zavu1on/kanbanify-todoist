/** One task's comments live entirely inside its own detail modal (no other
 * screen shows them, unlike tasks), so a single per-task key is enough —
 * no shared "all comments" prefix to invalidate across screens. */
export const commentsListQueryKey = (taskId: string) =>
  ["comments", "list", taskId] as const;
