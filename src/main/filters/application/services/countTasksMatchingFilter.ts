import type { ITaskGateway } from "../../../tasks/application/ports/ITaskGateway";

/** Mirrors `countActiveTasksInProject` — a filter has no cheap server-side
 * count either, so this walks every page of `listTasksByFilter` and counts
 * top-level tasks the same way (excluding subtasks, which would otherwise be
 * double-counted alongside their parent). */
export const countTasksMatchingFilter = async (
  taskGateway: ITaskGateway,
  accessToken: string,
  filterQuery: string,
): Promise<number> => {
  let count = 0;
  let cursor: string | null = null;
  do {
    const page = await taskGateway.listTasksByFilter(
      accessToken,
      cursor,
      filterQuery,
    );
    count += page.tasks.filter((task) => task.parentId === null).length;
    cursor = page.nextCursor;
  } while (cursor !== null);
  return count;
};
