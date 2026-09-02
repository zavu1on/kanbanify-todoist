import {
  ActionIcon,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { PlusIcon, RefreshCwIcon } from "lucide-animated";
import type { FC } from "react";
import type { FilterDTO } from "@/main/filters";
import { SidebarFilterLink } from "./SidebarFilterLink";

type SidebarFiltersSectionProps = {
  filters: FilterDTO[];
  isRefetching: boolean;
  onRefetch: () => void;
  onAddFilter: () => void;
};

/** Mirrors `SidebarProjectsSection` exactly — same Divider + header +
 * refresh/add `ActionIcon`s + `Stack` shape ("Начало блока фильтров имеет
 * иконку refresh и '+'"). */
export const SidebarFiltersSection: FC<SidebarFiltersSectionProps> = ({
  filters,
  isRefetching,
  onRefetch,
  onAddFilter,
}) => (
  <>
    <Divider my="sm" />
    <Group justify="space-between" px="md" mb={4}>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase">
        Filters
      </Text>
      <Group gap={4}>
        <Tooltip label="Refresh filters">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            loading={isRefetching}
            aria-label="Refresh filters"
            onClick={onRefetch}
          >
            <RefreshCwIcon size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Add filter">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label="Add filter"
            onClick={onAddFilter}
          >
            <PlusIcon size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
    <Stack gap={4}>
      {filters.map((filter) => (
        <SidebarFilterLink key={filter.id} filter={filter} />
      ))}
    </Stack>
  </>
);
