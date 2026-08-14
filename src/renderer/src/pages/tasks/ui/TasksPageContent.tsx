import { Alert, Stack } from "@mantine/core";
import type { FC } from "react";
import { useState } from "react";
import {
  flattenTaskPages,
  projectTasksListQueryKey,
  tasksListQueryKey,
  useLoadMoreTasksHandler,
} from "@/entities/task";
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
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const tasksQuery = useTasksQuery(projectId);

  const queryKey = projectId
    ? projectTasksListQueryKey(projectId)
    : tasksListQueryKey;

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    saveViewMode(mode);
  };

  const handleLoadMore = useLoadMoreTasksHandler(tasksQuery);
  const { tasks, initialLoadError } = flattenTaskPages(tasksQuery);

  return (
    <Stack gap="md">
      <TasksPageToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
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
      ) : viewMode === "list" ? (
        <TaskListView
          tasks={tasks}
          queryKey={queryKey}
          hideProject={!!projectId}
          projectId={projectId}
        />
      ) : (
        <TaskBoardView
          tasks={tasks}
          queryKey={queryKey}
          hideProject={!!projectId}
          projectId={projectId}
        />
      )}
    </Stack>
  );
};
