import type { ITaskGateway } from "../../../tasks/application/ports/ITaskGateway";

/** "Active" here means Todoist-incomplete — `getTasks` never returns
 * completed tasks, so a full page walk is enough (see `CountUnfinishedTasksUseCase`).
 * Shared between `ListProjectsUseCase` and `GetProjectUseCase` — both need a
 * single project's active count, just for a different set of projects. */
export const countActiveTasksInProject = async (
  taskGateway: ITaskGateway,
  accessToken: string,
  projectId: string,
): Promise<number> => {
  let count = 0;
  let cursor: string | null = null;
  do {
    const page = await taskGateway.listTasks(accessToken, cursor, projectId);
    count += page.tasks.length;
    cursor = page.nextCursor;
  } while (cursor !== null);
  return count;
};
