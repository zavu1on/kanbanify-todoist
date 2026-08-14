import type { QueryKey } from "@tanstack/react-query";
import { CalendarDaysIcon, ListIcon } from "lucide-animated";
import type { FC } from "react";
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

export const CalendarPageToolbar: FC<CalendarPageToolbarProps> = ({
  viewMode,
  onViewModeChange,
  queryKey,
  isRefetching,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}) => {
  return useToolbar<ViewMode>({
    viewMode,
    onViewModeChange,
    segments: [
      {
        value: "month",
        label: <CalendarDaysIcon size={16} animateOnHover={false} />,
      },
      { value: "agenda", label: <ListIcon size={16} animateOnHover={false} /> },
    ],
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
};
