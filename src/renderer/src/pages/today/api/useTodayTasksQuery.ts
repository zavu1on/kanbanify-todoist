import { useInfiniteQuery } from "@tanstack/react-query";
import { todayTasksListQueryKey } from "@/entities/task";
import { STALE_TIME } from "@/shared/api/queryConfig";
import { listTodayTasks } from "./listTodayTasks";

/** Same pagination/caching shape as `pages/tasks`' `useTasksQuery` — see
 * that file's doc comment. Scoped to `tasks:listToday` (SPECIFICATION.md
 * "Сегодня": `today | overdue`) instead of the flat task list. */
export const useTodayTasksQuery = () =>
  useInfiniteQuery({
    queryKey: todayTasksListQueryKey,
    queryFn: ({ pageParam }) => listTodayTasks(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.ok ? lastPage.nextCursor : undefined,
    staleTime: STALE_TIME,
  });
