import { Box, Group, Stack } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { CalendarDaysIcon, ListIcon } from "lucide-animated";
import type { FC, ReactElement } from "react";
import { memo } from "react";
import {
  DUE_STATE_COLORS,
  PRIORITY_MARKER_COLORS,
  useToolbar,
} from "@/entities/task";
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
    label: (
      <Group gap={6} wrap="nowrap">
        <CalendarDaysIcon size={15} animateOnHover={false} />
        <span>Month</span>
      </Group>
    ),
  },
  {
    value: "agenda",
    label: (
      <Group gap={6} wrap="nowrap">
        <ListIcon size={15} animateOnHover={false} />
        <span>Agenda</span>
      </Group>
    ),
  },
] satisfies { value: ViewMode; label: ReactElement }[];

const PRIORITY_LEGEND_ITEMS = [
  { label: "P1", color: PRIORITY_MARKER_COLORS.p1 },
  { label: "P2", color: PRIORITY_MARKER_COLORS.p2 },
  { label: "P3", color: PRIORITY_MARKER_COLORS.p3 },
] as const;

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
    const toolbar = useToolbar<ViewMode>({
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

    return (
      <Stack gap={8}>
        {toolbar}

        <Group gap={14} fz={12} c="dimmed">
          {PRIORITY_LEGEND_ITEMS.map(({ label, color }) => (
            <Group key={label} gap={6} wrap="nowrap">
              <Box w={3} h={11} bdrs={999} bg={color} />
              <span>{label}</span>
            </Group>
          ))}
          <Group gap={6} wrap="nowrap" c={DUE_STATE_COLORS.overdue}>
            <Box w={7} h={7} bdrs={999} bg={DUE_STATE_COLORS.overdue} />
            <span>overdue</span>
          </Group>
        </Group>
      </Stack>
    );
  },
);
