import { Box, Group } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { CalendarDaysIcon, LayoutGridIcon, ListIcon } from "lucide-animated";
import type { FC, ReactElement } from "react";
import { memo } from "react";
import { useToolbar } from "@/entities/task";
import type { ViewMode } from "../model/viewMode";

type TasksPageToolbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  // Gates the "calendar" segment — only a project's page has a single
  // project to scope the month grid to (SPECIFICATION.md "Задачи").
  isProjectPage: boolean;
  queryKey: QueryKey;
  isRefetching: boolean;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

// Static — doesn't depend on props, so it's declared once here instead of
// being rebuilt (with fresh icon elements) on every render, which made
// SegmentedControl's `data` prop change identity on every task list update
// and reset its slide indicator/icons, showing up as a toolbar flicker.
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

const VIEW_MODE_SEGMENTS_WITH_CALENDAR = [
  ...VIEW_MODE_SEGMENTS,
  {
    value: "calendar",
    label: (
      <Group gap={6} wrap="nowrap">
        <Box style={{ lineHeight: 0 }}>
          <CalendarDaysIcon size={15} animateOnHover={false} />
        </Box>
        <span>Month</span>
      </Group>
    ),
  },
] satisfies { value: ViewMode; label: ReactElement }[];

// `memo`-ed so an unrelated task list update (add/complete/etc. — which
// changes `tasks`, not any prop this component reads) doesn't re-render the
// toolbar. Only holds if every prop below is itself referentially stable
// across those updates — see `TasksPageContent`'s `queryKey`/`onViewModeChange`
// and `useLoadMoreTasksHandler`'s `onLoadMore`.
export const TasksPageToolbar: FC<TasksPageToolbarProps> = memo(
  function TasksPageToolbar({
    viewMode,
    onViewModeChange,
    isProjectPage,
    queryKey,
    isRefetching,
    onLoadMore,
    hasNextPage,
    isFetchingNextPage,
  }) {
    return useToolbar<ViewMode>({
      viewMode,
      onViewModeChange,
      segments: isProjectPage
        ? VIEW_MODE_SEGMENTS_WITH_CALENDAR
        : VIEW_MODE_SEGMENTS,
      refetchQueryKeys: [
        queryKey,
        ["tasks", "list", "subtasks"],
        ["comments", "list"],
      ],
      isRefetching,
      onLoadMore,
      hasNextPage,
      isFetchingNextPage,
    });
  },
);
