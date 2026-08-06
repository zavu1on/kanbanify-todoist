/** The IPC-serializable input for `projects:update` — `parentId` is deliberately
 * absent, see `Project.updateDetails`: the SDK's `updateProject` can't change it. */
export type UpdateProjectRequest = {
  name: string;
  description: string;
  color: string;
};
