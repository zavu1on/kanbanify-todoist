import { Group } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { LayoutGridIcon, ListIcon } from "lucide-animated";
import type { FC, ReactElement } from "react";
import { memo } from "react";
import { useToolbar } from "@/entities/task";
import type { ViewMode } from "../model/viewMode";

type TodayPageToolbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  queryKey: QueryKey;
  isRefetching: boolean;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

// Same reasoning as `TasksPageToolbar.tsx` — static so `SegmentedControl`'s
// `data` prop doesn't change identity (and reset its slide indicator) on
// every task list update.
const VIEW_MODE_SEGMENTS = [
  {
    value: "list",
    label: (
      <Group gap={6} wrap="nowrap">
        <ListIcon size={15} animateOnHover={false} />
        <span>List</span>
      </Group>
    ),
  },
  {
    value: "kanban",
    label: (
      <Group gap={6} wrap="nowrap">
        <LayoutGridIcon size={15} animateOnHover={false} />
        <span>Board</span>
      </Group>
    ),
  },
] satisfies { value: ViewMode; label: ReactElement }[];

// `memo`-ed for the same reason as `TasksPageToolbar` — holds only because
// every prop below is kept referentially stable upstream (`TodayPageContent`).
export const TodayPageToolbar: FC<TodayPageToolbarProps> = memo(
  function TodayPageToolbar({
    viewMode,
    onViewModeChange,
    queryKey,
    isRefetching,
    onLoadMore,
    hasNextPage,
    isFetchingNextPage,
  }) {
    return useToolbar<ViewMode>({
      viewMode,
      onViewModeChange,
      segments: VIEW_MODE_SEGMENTS,
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
