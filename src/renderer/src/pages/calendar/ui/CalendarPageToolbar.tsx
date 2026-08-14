import type { QueryKey } from "@tanstack/react-query";
import { CalendarDaysIcon, ListIcon } from "lucide-animated";
import type { FC, ReactElement } from "react";
import { memo } from "react";
import { useToolbar } from "@/entities/task";
import type { ViewMode } from "../model/viewMode";

type CalendarPageToolbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  queryKey: QueryKey;
  isRefetching: boolean;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

// Static — doesn't depend on props, so it's declared once here instead of
// being rebuilt (with fresh icon elements) on every render, which made
// SegmentedControl's `data` prop change identity on every task list update
// and reset its slide indicator/icons (see TasksPageToolbar.tsx, same fix).
const VIEW_MODE_SEGMENTS = [
  {
    value: "month",
    label: <CalendarDaysIcon size={16} animateOnHover={false} />,
  },
  { value: "agenda", label: <ListIcon size={16} animateOnHover={false} /> },
] satisfies { value: ViewMode; label: ReactElement }[];

// `memo`-ed so an unrelated task list update doesn't re-render the toolbar —
// only holds if every prop below is itself referentially stable across those
// updates, see CalendarPage.tsx's `handleViewModeChange`/`handleLoadMore`.
export const CalendarPageToolbar: FC<CalendarPageToolbarProps> = memo(
  function CalendarPageToolbar({
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
