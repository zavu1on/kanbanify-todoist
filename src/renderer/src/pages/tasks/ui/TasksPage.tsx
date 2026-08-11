import { Alert, Stack, Text, Title } from "@mantine/core";
import { LayoutGridIcon, ListIcon } from "lucide-animated";
import type { FC } from "react";
import { useState } from "react";
import { useParams } from "react-router";
import { useProjectsQuery } from "@/entities/project";
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

/** Renders both the all-tasks "Tasks" screen (`/tasks`) and a project's page
 * (`/projects/:projectId`) — SPECIFICATION.md "Сайдбар": a project page
 * "полностью повторяет страницу Задачи", just scoped to one project. */
export const TasksPage: FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const tasksQuery = useTasksQuery(projectId);
  const projectsQuery = useProjectsQuery();
  const project =
    projectId && projectsQuery.data?.ok
      ? projectsQuery.data.projects.find((p) => p.id === projectId)
      : undefined;

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
      <Stack gap={4}>
        <Title order={2}>
          {projectId ? (project?.name ?? "Project") : "Tasks"}
        </Title>
        {projectId && project?.description && (
          <Text size="sm" c="dimmed">
            {project.description}
          </Text>
        )}
      </Stack>

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
