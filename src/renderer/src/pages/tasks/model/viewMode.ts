export type ViewMode = "list" | "kanban";

const STORAGE_KEY = "kanbanify:tasks:viewMode";

/** View mode choice persists across launches (see SPECIFICATION.md "Задачи"). */
export const loadViewMode = (): ViewMode =>
  localStorage.getItem(STORAGE_KEY) === "kanban" ? "kanban" : "list";

export const saveViewMode = (mode: ViewMode): void => {
  localStorage.setItem(STORAGE_KEY, mode);
};
