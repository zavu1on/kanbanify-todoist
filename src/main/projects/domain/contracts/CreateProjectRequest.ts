/** The IPC-serializable input for `projects:create` — shared by `preload` (typing
 * the invoke call) and the renderer (building the payload), so neither side
 * restates these fields on its own. */
export type CreateProjectRequest = {
  name: string;
  description: string;
  color: string;
  parentId: string | null;
};
