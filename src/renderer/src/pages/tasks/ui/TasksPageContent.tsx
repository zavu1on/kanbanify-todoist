import { Alert, Stack } from "@mantine/core";
import { LayoutGridIcon, ListIcon } from "lucide-animated";
import type { FC } from "react";
import { useState } from "react";
import {
  flattenTaskPages,
  projectTasksListQueryKey,
  tasksListQueryKey,
  useLoadMoreTasksHandler,
  useToolbar,
} from "@/entities/task";
import { TaskBoard } from "@/widgets/task-board";
import { TaskListView } from "@/widgets/task-list";
import { useTasksQuery } from "../api/useTasksQuery";
import { loadViewMode, saveViewMode, type ViewMode } from "../model/viewMode";
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

  const toolbar = useToolbar<ViewMode>({
    viewMode,
    onViewModeChange: handleViewModeChange,
    segments: [
      { value: "list", label: <ListIcon size={16} animateOnHover={false} /> },
      {
        value: "kanban",
        label: <LayoutGridIcon size={16} animateOnHover={false} />,
      },
    ],
    refetchQueryKeys: [
      queryKey,
      ["tasks", "list", "subtasks"],
      ["comments", "list"],
    ],
    isRefetching: tasksQuery.isRefetching || tasksQuery.isLoading,
    onLoadMore: handleLoadMore,
    hasNextPage: tasksQuery.hasNextPage,
    isFetchingNextPage: tasksQuery.isFetchingNextPage,
  });

  return (
    <Stack gap="md">
      {toolbar}

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
        <TaskBoard
          tasks={tasks}
          queryKey={queryKey}
          hideProject={!!projectId}
          projectId={projectId}
        />
      )}
    </Stack>
  );
};
