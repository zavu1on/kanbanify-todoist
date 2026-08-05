import { ActionIcon, Group, SegmentedControl, Tooltip } from "@mantine/core";
import {
  DownloadIcon,
  LayoutGridIcon,
  ListIcon,
  RefreshCwIcon,
} from "lucide-animated";
import type { FC } from "react";
import type { ViewMode } from "../model/viewMode";

type TasksToolbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRefetch: () => void;
  isRefetching: boolean;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export const TasksToolbar: FC<TasksToolbarProps> = ({
  viewMode,
  onViewModeChange,
  onRefetch,
  isRefetching,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}) => {
  return (
    <Group justify="space-between">
      <SegmentedControl
        value={viewMode}
        onChange={(value) => onViewModeChange(value as ViewMode)}
        data={[
          {
            label: <ListIcon size={16} animateOnHover={false} />,
            value: "list",
          },
          {
            label: <LayoutGridIcon size={16} animateOnHover={false} />,
            value: "kanban",
          },
        ]}
      />

      <Group gap="xs">
        {hasNextPage && (
          <Tooltip label="Load more tasks">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              loading={isFetchingNextPage}
              onClick={onLoadMore}
              aria-label="Load more tasks"
            >
              <DownloadIcon size={18} animateOnHover />
            </ActionIcon>
          </Tooltip>
        )}

        <Tooltip label="Refetch (Ctrl+R)">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            loading={isRefetching}
            onClick={onRefetch}
            aria-label="Refetch tasks"
          >
            <RefreshCwIcon size={18} animateOnHover />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
};
