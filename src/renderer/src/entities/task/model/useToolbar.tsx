import { ActionIcon, Group, SegmentedControl, Tooltip } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { DownloadIcon, RefreshCwIcon } from "lucide-animated";
import type { ReactNode } from "react";
import { useRefetchTasksHandler } from "./useRefetchTasksHandler";

export type ToolbarSegment<TViewMode extends string> = {
  value: TViewMode;
  label: ReactNode;
};

type UseToolbarConfig<TViewMode extends string> = {
  viewMode: TViewMode;
  onViewModeChange: (mode: TViewMode) => void;
  // The view-mode switch itself — icon + value per segment, any count. Kept
  // generic over `TViewMode` so both Tasks ("list"/"kanban") and Calendar
  // ("month"/"agenda") share this hook without a union of every screen's
  // view modes.
  segments: ToolbarSegment<TViewMode>[];
  // Every cache prefix "Refetch" should reset — forwarded as-is to
  // `useRefetchTasksHandler`, which also wires up the Ctrl+R hotkey.
  refetchQueryKeys: QueryKey[];
  isRefetching: boolean;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

/** `pages/tasks` and `pages/calendar` render the exact same toolbar layout —
 * a view-mode switch, an optional "Load more" and a "Refetch" button — and
 * only ever differ in which view modes that switch offers. Unlike this
 * slice's other `model/` hooks, this one returns JSX rather than a plain
 * value: the toolbar itself is what's shared, not just non-UI logic behind
 * it, so the mounting page doesn't need its own toolbar component at all. */
export const useToolbar = <TViewMode extends string>({
  viewMode,
  onViewModeChange,
  segments,
  refetchQueryKeys,
  isRefetching,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: UseToolbarConfig<TViewMode>): ReactNode => {
  const handleRefetch = useRefetchTasksHandler(refetchQueryKeys);

  return (
    <Group justify="space-between">
      <SegmentedControl
        value={viewMode}
        onChange={(value) => onViewModeChange(value as TViewMode)}
        data={segments}
        radius={8}
      />

      <Group gap="xs">
        {hasNextPage && (
          <Tooltip label="Load more tasks">
            <ActionIcon
              variant="outline"
              color="gray"
              size={34}
              radius={9}
              loading={isFetchingNextPage}
              onClick={onLoadMore}
              aria-label="Load more tasks"
            >
              <DownloadIcon size={18} animateOnHover />
            </ActionIcon>
          </Tooltip>
        )}

        {/* Mounted wherever `viewMode` state lives (e.g. TasksPageContent),
         so toggling `viewMode` re-renders this button too, even though it
         doesn't depend on `viewMode` — not worth its own state boundary for
         one button. If more `viewMode`-independent pieces land here, split
         them out instead of letting this comment become the excuse to
         skip it. */}
        <Tooltip label="Refetch (Ctrl+R)">
          <ActionIcon
            variant="outline"
            color="gray"
            size={34}
            radius={9}
            loading={isRefetching}
            onClick={handleRefetch}
            aria-label="Refetch tasks"
          >
            <RefreshCwIcon size={18} animateOnHover />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
};
