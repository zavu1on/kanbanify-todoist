import { Alert, Stack } from "@mantine/core";
import type { DayOfWeek } from "@mantine/schedule";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { useSession } from "@/app/SessionContext";
import {
  flattenTaskPages,
  projectTasksListQueryKey,
  tasksListQueryKey,
  useLoadMoreTasksHandler,
} from "@/entities/task";
import { CalendarMonthView } from "@/widgets/calendar-month-view";
import { TaskBoardView } from "@/widgets/task-board";
import { TaskListView } from "@/widgets/task-list";
import { useTasksQuery } from "../api/useTasksQuery";
import { loadViewMode, saveViewMode, type ViewMode } from "../model/viewMode";
import { TasksPageToolbar } from "./TasksPageToolbar";
import { TasksSkeleton } from "./TasksSkeleton";

type TasksPageContentProps = {
  projectId?: string;
};

/** Owns everything that changes on view-mode toggle or task refetch/pagination
 * so switching between list and kanban doesn't re-render the page title. */
export const TasksPageContent: FC<TasksPageContentProps> = ({ projectId }) => {
  const session = useSession();
  // Falls back to Monday if the session hasn't resolved yet — mirrors
  // `CalendarPage`, which this view's calendar mode reuses the month grid
  // from.
  const weekStartsOn: DayOfWeek =
    session.status === "authenticated"
      ? (session.user.weekStartsOn as DayOfWeek)
      : 1;

  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  // "calendar" only exists on a project's page — a stored preference from
  // there shouldn't silently apply on the unscoped Tasks page.
  const effectiveViewMode: ViewMode =
    !projectId && viewMode === "calendar" ? "list" : viewMode;
  const tasksQuery = useTasksQuery(projectId);

  // `projectTasksListQueryKey` builds a fresh array every call — memoized so
  // it (and everything downstream keyed off it, e.g. `TasksPageToolbar`'s
  // `memo`) doesn't see a new reference on every unrelated render.
  const queryKey = useMemo(
    () => (projectId ? projectTasksListQueryKey(projectId) : tasksListQueryKey),
    [projectId],
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    saveViewMode(mode);
  }, []);

  const handleLoadMore = useLoadMoreTasksHandler(tasksQuery);
  const { tasks, initialLoadError } = flattenTaskPages(tasksQuery);

  return (
    <Stack gap="md">
      <TasksPageToolbar
        viewMode={effectiveViewMode}
        onViewModeChange={handleViewModeChange}
        isProjectPage={!!projectId}
        queryKey={queryKey}
        isRefetching={tasksQuery.isRefetching || tasksQuery.isLoading}
        onLoadMore={handleLoadMore}
        hasNextPage={tasksQuery.hasNextPage}
        isFetchingNextPage={tasksQuery.isFetchingNextPage}
      />

      {tasksQuery.isPending ? (
        <TasksSkeleton />
      ) : initialLoadError ? (
        <Alert color="red" title="Couldn't load tasks">
          {initialLoadError.message}
        </Alert>
      ) : effectiveViewMode === "list" ? (
        <TaskListView
          tasks={tasks}
          queryKey={queryKey}
          hideProject={!!projectId}
          projectId={projectId}
        />
      ) : effectiveViewMode === "kanban" ? (
        <TaskBoardView
          tasks={tasks}
          queryKey={queryKey}
          hideProject={!!projectId}
          projectId={projectId}
        />
      ) : (
        <CalendarMonthView
          tasks={tasks}
          queryKey={queryKey}
          weekStartsOn={weekStartsOn}
          projectId={projectId}
        />
      )}
    </Stack>
  );
};
