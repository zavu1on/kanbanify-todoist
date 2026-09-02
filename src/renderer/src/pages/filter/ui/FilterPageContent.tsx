import { Alert, Box, Group, Stack } from "@mantine/core";
import { LayoutGridIcon, ListIcon } from "lucide-animated";
import { type FC, type ReactElement, useState } from "react";
import {
  filterTasksListQueryKey,
  useFilterTasksQuery,
} from "@/entities/filter";
import {
  flattenTaskPages,
  useLoadMoreTasksHandler,
  useToolbar,
} from "@/entities/task";
import { TaskBoardView } from "@/widgets/task-board";
import { TaskListView } from "@/widgets/task-list";
import { FilterTasksSkeleton } from "./FilterTasksSkeleton";

type ViewMode = "list" | "kanban";

const VIEW_MODE_SEGMENTS = [
  {
    value: "list",
    label: (
      <Group gap={6} wrap="nowrap">
        <Box style={{ lineHeight: 0 }}>
          <ListIcon size={15} animateOnHover={false} />
        </Box>
        <span>List</span>
      </Group>
    ),
  },
  {
    value: "kanban",
    label: (
      <Group gap={6} wrap="nowrap">
        <Box style={{ lineHeight: 0 }}>
          <LayoutGridIcon size={15} animateOnHover={false} />
        </Box>
        <span>Board</span>
      </Group>
    ),
  },
] satisfies { value: ViewMode; label: ReactElement }[];

type FilterPageContentProps = {
  filterId: number;
};

/**
 * Mirrors `pages/tasks`' `TasksPageContent` — view-mode toggle, toolbar,
 * List/Board switch — but scoped to one filter's tasks instead of a
 * project/the whole list, with no Calendar mode (only List/Board is asked
 * for) and no create button on either view (a filter can match many
 * projects/statuses at once, so there's no single unambiguous default for a
 * new task — see `TaskListView`/`TaskBoardView`'s `hideAddButton`).
 */
export const FilterPageContent: FC<FilterPageContentProps> = ({ filterId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const tasksQuery = useFilterTasksQuery(filterId);
  const queryKey = filterTasksListQueryKey(filterId);

  const handleLoadMore = useLoadMoreTasksHandler(tasksQuery);
  const { tasks, initialLoadError } = flattenTaskPages(tasksQuery);

  const toolbar = useToolbar<ViewMode>({
    viewMode,
    onViewModeChange: setViewMode,
    segments: VIEW_MODE_SEGMENTS,
    refetchQueryKeys: [queryKey, ["comments", "list"]],
    isRefetching: tasksQuery.isRefetching || tasksQuery.isLoading,
    onLoadMore: handleLoadMore,
    hasNextPage: tasksQuery.hasNextPage,
    isFetchingNextPage: tasksQuery.isFetchingNextPage,
  });

  return (
    <Stack gap="md">
      {toolbar}

      {tasksQuery.isPending ? (
        <FilterTasksSkeleton />
      ) : initialLoadError ? (
        <Alert color="red" title="Couldn't load tasks">
          {initialLoadError.message}
        </Alert>
      ) : viewMode === "list" ? (
        <TaskListView
          tasks={tasks}
          queryKey={queryKey}
          hideProject={false}
          hideAddButton
        />
      ) : (
        <TaskBoardView
          tasks={tasks}
          queryKey={queryKey}
          hideProject={false}
          hideAddButton
        />
      )}
    </Stack>
  );
};
