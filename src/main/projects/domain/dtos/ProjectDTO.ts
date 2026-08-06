/** The IPC-serializable shape of a `Project` — Electron's structured clone only
 * carries own enumerable properties across the boundary, so `Project`'s
 * getters (backed by private fields) never survive the trip. This is the
 * plain shape every module contract must carry instead of the entity itself. */
export type ProjectDTO = {
  id: string;
  name: string;
  description: string;
  color: string;
  parentId: string | null;
  isInboxProject: boolean;
  isArchived: boolean;
  activeTaskCount: number;
};
