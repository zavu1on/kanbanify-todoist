import { Alert, Stack } from "@mantine/core";
import dayjs from "dayjs";
import type { FC } from "react";
import { useCallback, useState } from "react";
import {
  flattenTaskPages,
  todayTasksListQueryKey,
  useLoadMoreTasksHandler,
} from "@/entities/task";
import { TaskBoardView } from "@/widgets/task-board";
import { TodayListView } from "@/widgets/today-list";
import { useTodayTasksQuery } from "../api/useTodayTasksQuery";
import { loadViewMode, saveViewMode, type ViewMode } from "../model/viewMode";
import { TodayEmptyState } from "./TodayEmptyState";
import { TodayPageToolbar } from "./TodayPageToolbar";
import { TodaySkeleton } from "./TodaySkeleton";

const TODAY_DUE = { date: dayjs().format("YYYY-MM-DD"), datetime: null };

/** Owns everything that changes on view-mode toggle or task refetch/pagination
 * — same split as `TasksPageContent`, this page's model. */
export const TodayPageContent: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const tasksQuery = useTodayTasksQuery();

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    saveViewMode(mode);
  }, []);

  const handleLoadMore = useLoadMoreTasksHandler(tasksQuery);
  const { tasks, initialLoadError } = flattenTaskPages(tasksQuery);
  const isEmpty =
    !tasksQuery.isPending && !initialLoadError && tasks.length === 0;

  return (
    <Stack gap="md">
      <TodayPageToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        queryKey={todayTasksListQueryKey}
        isRefetching={tasksQuery.isRefetching || tasksQuery.isLoading}
        onLoadMore={handleLoadMore}
        hasNextPage={tasksQuery.hasNextPage}
        isFetchingNextPage={tasksQuery.isFetchingNextPage}
      />

      {tasksQuery.isPending ? (
        <TodaySkeleton />
      ) : initialLoadError ? (
        <Alert color="red" title="Couldn't load tasks">
          {initialLoadError.message}
        </Alert>
      ) : isEmpty ? (
        <TodayEmptyState />
      ) : viewMode === "list" ? (
        <TodayListView tasks={tasks} queryKey={todayTasksListQueryKey} />
      ) : (
        <TaskBoardView
          tasks={tasks}
          queryKey={todayTasksListQueryKey}
          createDueDefault={TODAY_DUE}
        />
      )}
    </Stack>
  );
};
