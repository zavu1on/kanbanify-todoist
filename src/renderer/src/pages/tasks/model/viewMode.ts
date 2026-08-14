// "calendar" is only offered on a project's page (SPECIFICATION.md
// "Задачи") — `TasksPageContent` falls back to "list" if it's loaded on the
// unscoped Tasks page.
export type ViewMode = "list" | "kanban" | "calendar";

const STORAGE_KEY = "kanbanify:tasks:viewMode";

/** View mode choice persists across launches (see SPECIFICATION.md "Задачи"). */
export const loadViewMode = (): ViewMode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "kanban" || stored === "calendar" ? stored : "list";
};

export const saveViewMode = (mode: ViewMode): void => {
  localStorage.setItem(STORAGE_KEY, mode);
};
