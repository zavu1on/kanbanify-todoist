import { Alert, Stack, Title } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import type { FC } from "react";
import { useState } from "react";
import { tasksListQueryKey } from "@/entities/task";
import { TaskBoard } from "@/widgets/task-board";
import { TaskListView } from "@/widgets/task-list";
import { useTasksQuery } from "../api/useTasksQuery";
import { loadViewMode, saveViewMode, type ViewMode } from "../model/viewMode";
import { TasksSkeleton } from "./TasksSkeleton";
import { TasksToolbar } from "./TasksToolbar";

export const TasksPage: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const queryClient = useQueryClient();
  const tasksQuery = useTasksQuery();

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    saveViewMode(mode);
  };

  // "Refetch" means reload, not "fetch one more page on top of what's cached" —
  // resetQueries drops every already-loaded page and starts back at page 1,
  // unlike `refetch()`, which would re-fetch all of them.
  const handleRefetch = () => {
    queryClient.resetQueries({ queryKey: tasksListQueryKey });
  };

  useHotkeys([["mod+R", handleRefetch]]);

  const handleLoadMore = async () => {
    const result = await tasksQuery.fetchNextPage();
    const pages = result.data?.pages ?? [];
    const lastPage = pages.at(-1);
    if (!lastPage) return;

    if (lastPage.ok) {
      const totalLoaded = pages.reduce(
        (sum, page) => sum + (page.ok ? page.tasks.length : 0),
        0,
      );
      notifications.show({
        color: "green",
        title: "Tasks loaded",
        message: `Loaded ${totalLoaded} tasks in total`,
      });
    } else {
      notifications.show({
        color: "red",
        title: "Couldn't load more tasks",
        message: lastPage.error.message,
      });
    }
  };

  const pages = tasksQuery.data?.pages ?? [];
  const tasks = pages.flatMap((page) => (page.ok ? page.tasks : []));
  const firstPage = pages[0];
  const initialLoadError = firstPage && !firstPage.ok ? firstPage.error : null;

  return (
    <Stack gap="md">
      <Title order={2}>Tasks</Title>

      <TasksToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onRefetch={handleRefetch}
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
        <TaskListView tasks={tasks} />
      ) : (
        <TaskBoard tasks={tasks} />
      )}
    </Stack>
  );
};
