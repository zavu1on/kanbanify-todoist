/** The IPC-serializable input for `labels:create` — shared by `preload` (typing
 * the invoke call) and the renderer (building the payload), so neither side
 * restates these fields on its own. */
export type CreateLabelRequest = {
  name: string;
};
