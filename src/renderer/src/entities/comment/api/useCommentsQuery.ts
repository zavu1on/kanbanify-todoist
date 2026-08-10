import { useQuery } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/api/queryConfig";
import { commentsListQueryKey } from "../model/queryKeys";
import { listComments } from "./listComments";

/**
 * A task's comments, fetched only while its detail modal is open — the
 * backend already collects every page internally (see `TodoistCommentGateway`'s
 * `do...while` loop), so this is a plain `useQuery`, not `useInfiniteQuery`.
 */
export const useCommentsQuery = (taskId: string) =>
  useQuery({
    queryKey: commentsListQueryKey(taskId),
    queryFn: () => listComments(taskId),
    staleTime: STALE_TIME,
  });
