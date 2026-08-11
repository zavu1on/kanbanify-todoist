export type ViewMode = "month" | "agenda";

const STORAGE_KEY = "kanbanify:calendar:viewMode";

/** View mode choice persists across launches (see SPECIFICATION.md "Календарь"). */
export const loadViewMode = (): ViewMode =>
  localStorage.getItem(STORAGE_KEY) === "agenda" ? "agenda" : "month";

export const saveViewMode = (mode: ViewMode): void => {
  localStorage.setItem(STORAGE_KEY, mode);
};
