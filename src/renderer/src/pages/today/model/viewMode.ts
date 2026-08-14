export type ViewMode = "list" | "kanban";

const STORAGE_KEY = "kanbanify:today:viewMode";

/** View mode choice persists across launches — same pattern as `pages/tasks`
 * (SPECIFICATION.md "Сегодня": "те же два вида отображения"), kept in its
 * own storage key so the two pages' choices don't leak into each other. */
export const loadViewMode = (): ViewMode =>
  localStorage.getItem(STORAGE_KEY) === "kanban" ? "kanban" : "list";

export const saveViewMode = (mode: ViewMode): void => {
  localStorage.setItem(STORAGE_KEY, mode);
};
